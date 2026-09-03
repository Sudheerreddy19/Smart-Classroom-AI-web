import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  CalendarDays, Pencil, RefreshCw, CheckCircle2, Clock,
  ChevronDown, ChevronUp, Building2, Loader2, Save, X, Info
} from "lucide-react";
import { fetchDepartments, selectDepartments } from "../../store/slices/departmentSlice";
import { usePermissions } from "../../hooks/usePermissions";
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

// ── Default semester timeline reference (shown in the page header) ──────────
const SEMESTER_TIMELINE = [
  { n: 1, label: "Semester 1", start: "01 Sep 2026", end: "31 Jan 2027" },
  { n: 2, label: "Semester 2", start: "01 Mar 2027", end: "31 Jul 2027" },
  { n: 3, label: "Semester 3", start: "01 Sep 2027", end: "31 Jan 2028" },
  { n: 4, label: "Semester 4", start: "01 Mar 2028", end: "31 Jul 2028" },
  { n: 5, label: "Semester 5", start: "01 Sep 2028", end: "31 Jan 2029" },
  { n: 6, label: "Semester 6", start: "01 Mar 2029", end: "31 Jul 2029" },
  { n: 7, label: "Semester 7", start: "01 Sep 2029", end: "31 Jan 2030" },
  { n: 8, label: "Semester 8", start: "01 Mar 2030", end: "31 Jul 2030" },
];

const SEM_COLORS = [
  "#6366f1","#8b5cf6","#ec4899","#f97316",
  "#eab308","#22c55e","#06b6d4","#3b82f6"
];

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function semStatus(sem) {
  const today = new Date();
  if (!sem.startDate || !sem.endDate) return "pending";
  const start = new Date(sem.startDate);
  const end   = new Date(sem.endDate);
  if (today < start) return "upcoming";
  if (today > end)   return "completed";
  return "current";
}

const STATUS_STYLE = {
  current:   { bg: "#dcfce7", text: "#166534", label: "● Current" },
  upcoming:  { bg: "#eff6ff", text: "#1d4ed8", label: "Upcoming" },
  completed: { bg: "#f3f4f6", text: "#6b7280", label: "Completed" },
  pending:   { bg: "#fef9c3", text: "#92400e", label: "No Dates" },
};

export default function Semesters() {
  const dispatch = useDispatch();
  const { canManageAcademic } = usePermissions();
  const { list: depts } = useSelector(selectDepartments);

  // Per-department semesters map: { [deptId]: Semester[] }
  const [semMap, setSemMap] = useState({});
  const [loadingDepts, setLoadingDepts] = useState({});
  const [expanded, setExpanded] = useState({});

  // Edit modal
  const [editSem, setEditSem]   = useState(null);
  const [editForm, setEditForm] = useState({ startDate: "", endDate: "" });
  const [saving, setSaving]     = useState(false);

  // Timeline info toggle
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Auto-expand first dept and load its semesters
  useEffect(() => {
    if (depts.length > 0) {
      const firstId = depts[0].id;
      setExpanded({ [firstId]: true });
      loadSemesters(firstId);
    }
  }, [depts.length]);

  const loadSemesters = async (deptId) => {
    setLoadingDepts(p => ({ ...p, [deptId]: true }));
    try {
      const { data } = await axiosClient.get(`/semesters/department/${deptId}`);
      const sorted = [...(Array.isArray(data) ? data : data.content ?? [])].sort((a, b) => a.number - b.number);
      setSemMap(p => ({ ...p, [deptId]: sorted }));
    } catch {
      toast.error("Failed to load semesters.");
    } finally {
      setLoadingDepts(p => ({ ...p, [deptId]: false }));
    }
  };

  const toggleDept = (deptId) => {
    const isOpen = !!expanded[deptId];
    setExpanded(p => ({ ...p, [deptId]: !isOpen }));
    if (!isOpen && !semMap[deptId]) {
      loadSemesters(deptId);
    }
  };

  const openEdit = (sem) => {
    setEditSem(sem);
    setEditForm({ startDate: sem.startDate || "", endDate: sem.endDate || "", applyToAll: false });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editSem) return;
    setSaving(true);
    try {
      const { data } = await axiosClient.patch(`/semesters/${editSem.id}/timeline`, {
        startDate: editForm.startDate || null,
        endDate:   editForm.endDate   || null,
        applyToAll: !!editForm.applyToAll,
      });

      if (editForm.applyToAll) {
        // Refresh ALL expanded departments
        toast.success(data.message || "Timeline applied to all departments!");
        Object.keys(expanded).filter(id => expanded[id]).forEach(id => loadSemesters(Number(id)));
      } else {
        // Update just this semester in semMap
        setSemMap(p => ({
          ...p,
          [editSem.departmentId]: (p[editSem.departmentId] || []).map(s =>
            s.id === data.id ? data : s
          )
        }));
        toast.success(`${editSem.name} dates updated!`);
      }
      setEditSem(null);
    } catch {
      toast.error("Failed to update semester dates.");
    } finally {
      setSaving(false);
    }
  };

  const totalSems = Object.values(semMap).reduce((acc, arr) => acc + arr.length, 0);
  const currentSems = Object.values(semMap).flat().filter(s => semStatus(s) === "current").length;

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Semesters</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            8 semesters are auto-created for each department with default timeline dates.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setShowTimeline(t => !t)}
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px", fontSize: 13, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Info size={14} /> {showTimeline ? "Hide" : "View"} Timeline
          </button>
          <button
            onClick={() => depts.forEach(d => loadSemesters(d.id))}
            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", color: "#64748b", cursor: "pointer" }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Departments", value: depts.length, color: "#6366f1" },
          { label: "Current", value: currentSems, color: "#22c55e" },
          { label: "Sems / Dept", value: 8, color: "#f97316" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Global Timeline Reference ── */}
      {showTimeline && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
            📅 Default Academic Timeline (applies to all departments)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
            {SEMESTER_TIMELINE.map(t => (
              <div key={t.n} style={{ display: "flex", alignItems: "center", gap: 12, background: "#f8fafc", borderRadius: 10, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: SEM_COLORS[t.n - 1] + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: SEM_COLORS[t.n - 1] }}>{t.n}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t.start} → {t.end}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 14px", marginTop: 14, fontSize: 12, color: "#1d4ed8" }}>
            💡 These dates are auto-assigned. Admins and HODs can edit individual semester dates by clicking the pencil icon below.
          </div>
        </div>
      )}

      {/* ── Department Accordion ── */}
      {depts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#94a3b8", background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0" }}>
          <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>No departments found. Add departments first.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {depts.map(dept => {
            const isOpen = !!expanded[dept.id];
            const sems   = semMap[dept.id] || [];
            const isLoading = !!loadingDepts[dept.id];
            const curSem = sems.find(s => semStatus(s) === "current");

            return (
              <div key={dept.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                {/* Dept header */}
                <div
                  onClick={() => toggleDept(dept.id)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", cursor: "pointer", background: isOpen ? "#f8fafc" : "#fff" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#6366f120", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building2 size={18} color="#6366f1" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{dept.name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {isLoading ? "Loading…" : `${sems.length} / 8 semesters`}
                        {curSem && <span style={{ marginLeft: 10, color: "#16a34a", fontWeight: 600 }}>● Currently: {curSem.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Progress dots */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {Array.from({ length: 8 }, (_, i) => {
                        const s = sems.find(x => x.number === i + 1);
                        const st = s ? semStatus(s) : "pending";
                        return (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: st === "current" ? "#22c55e" : st === "completed" ? "#94a3b8" : st === "upcoming" ? "#93c5fd" : "#fbbf24" }} title={`Sem ${i + 1}: ${st}`} />
                        );
                      })}
                    </div>
                    {isOpen ? <ChevronUp size={18} color="#94a3b8" /> : <ChevronDown size={18} color="#94a3b8" />}
                  </div>
                </div>

                {/* Semester cards */}
                {isOpen && (
                  <div style={{ padding: "0 20px 20px" }}>
                    {isLoading ? (
                      <div style={{ textAlign: "center", padding: 30, color: "#94a3b8" }}>
                        <Loader2 size={20} style={{ animation: "spin 1s linear infinite", display: "inline" }} />
                        <span style={{ marginLeft: 8 }}>Loading semesters…</span>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                        {Array.from({ length: 8 }, (_, i) => {
                          const sem = sems.find(s => s.number === i + 1);
                          const st  = sem ? semStatus(sem) : "pending";
                          const stStyle = STATUS_STYLE[st];
                          const color = SEM_COLORS[i];
                          return (
                            <div key={i + 1} style={{ border: `1.5px solid ${st === "current" ? "#22c55e" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", background: st === "current" ? "#f0fdf4" : "#fff", position: "relative" }}>
                              {/* Number badge */}
                              <div style={{ position: "absolute", top: 12, right: 12 }}>
                                <span style={{ background: stStyle.bg, color: stStyle.text, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "2px 8px" }}>{stStyle.label}</span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 9, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <span style={{ fontSize: 14, fontWeight: 800, color }}>{i + 1}</span>
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{sem?.name || `Semester ${i + 1}`}</div>
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                                <CalendarDays size={12} />
                                {sem?.startDate ? (
                                  <span>{fmt(sem.startDate)} → {fmt(sem.endDate)}</span>
                                ) : (
                                  <span style={{ color: "#f59e0b" }}>Dates not set</span>
                                )}
                              </div>
                              {canManageAcademic && sem && (
                                <button
                                  onClick={() => openEdit(sem)}
                                  style={{ marginTop: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                                >
                                  <Pencil size={12} /> Edit Dates
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Dates Modal ── */}
      {editSem && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 420 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Semester Dates</h3>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{editSem.name} · {editSem.departmentName}</p>
              </div>
              <button onClick={() => setEditSem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X size={20} /></button>
            </div>
            <form onSubmit={saveEdit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>START DATE</label>
                <input type="date" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 6 }}>END DATE</label>
                <input type="date" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>

              {/* Apply to all departments toggle */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "12px 14px", borderRadius: 10, background: editForm.applyToAll ? "#fef3c7" : "#f8fafc", border: `1px solid ${editForm.applyToAll ? "#f59e0b" : "#e2e8f0"}` }}>
                <input
                  type="checkbox"
                  checked={!!editForm.applyToAll}
                  onChange={e => setEditForm(p => ({ ...p, applyToAll: e.target.checked }))}
                  style={{ marginTop: 2, accentColor: "#f59e0b", width: 15, height: 15, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: editForm.applyToAll ? "#92400e" : "#374151" }}>
                    Apply to ALL Departments
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {editForm.applyToAll
                      ? `⚠️ Semester ${editSem.number} dates will change for every department`
                      : `Only updates ${editSem.departmentName}`}
                  </div>
                </div>
              </label>

              <div style={{ background: "#eff6ff", borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#1d4ed8" }}>
                <CheckCircle2 size={13} style={{ display: "inline", marginRight: 6 }} />
                Attendance percentages are automatically recalculated based on working days in this range.
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="submit" disabled={saving} style={{ flex: 1, background: editForm.applyToAll ? "#f59e0b" : "#6366f1", border: "none", borderRadius: 10, padding: "11px 0", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {saving ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Save size={15} /> {editForm.applyToAll ? "Apply to All Depts" : "Save Dates"}</>}
                </button>
                <button type="button" onClick={() => setEditSem(null)} style={{ flex: 1, background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: "11px 0", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
