import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Pencil, Trash2,
  CheckCircle, XCircle, AlertCircle, BookOpen, Sun, Coffee,
  GraduationCap, Globe, Building, RefreshCw, Save, X, Info
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { selectUser } from "../../store/slices/authSlice";

// ── Constants ────────────────────────────────────────────────────────────────
const HOLIDAY_TYPES = [
  { value: "NATIONAL",   label: "National Holiday",   color: "#ef4444", icon: Globe     },
  { value: "PUBLIC",     label: "Public Holiday",     color: "#f97316", icon: Sun       },
  { value: "COLLEGE",    label: "College Holiday",    color: "#8b5cf6", icon: Building  },
  { value: "EXAM",       label: "Exam Holiday",       color: "#3b82f6", icon: GraduationCap },
  { value: "RESTRICTED", label: "Restricted Holiday", color: "#6b7280", icon: Coffee    },
];

const DAY_COLORS = {
  WORKING:         { bg: "#dcfce7", text: "#166534", label: "Working" },
  WEEKEND_SAT:     { bg: "#fef9c3", text: "#854d0e", label: "Saturday" },
  WEEKEND_SUN:     { bg: "#fee2e2", text: "#991b1b", label: "Sunday" },
  NATIONAL:        { bg: "#fca5a5", text: "#7f1d1d", label: "National Holiday" },
  PUBLIC:          { bg: "#fdba74", text: "#7c2d12", label: "Public Holiday" },
  COLLEGE:         { bg: "#c4b5fd", text: "#4c1d95", label: "College Holiday" },
  EXAM:            { bg: "#93c5fd", text: "#1e3a8a", label: "Exam Holiday" },
  RESTRICTED:      { bg: "#d1d5db", text: "#374151", label: "Restricted" },
  OUT_OF_SEMESTER: { bg: "transparent", text: "#d1d5db", label: "" },
};

const MGMT_ROLES = ["SUPER_ADMIN", "ADMIN", "HOD"];

export default function AcademicCalendar() {
  const user = useSelector(selectUser);
  const canEdit = MGMT_ROLES.includes(user?.role);

  // Semester list & selection
  const [departments, setDepartments]   = useState([]);
  const [selDeptId, setSelDeptId]       = useState("");
  const [calendars, setCalendars]       = useState([]);
  const [selSemId, setSelSemId]         = useState(null);
  const [selCal, setSelCal]             = useState(null);

  // UI state
  const [activeTab, setActiveTab]       = useState("overview"); // overview | calendar | holidays
  const [viewMonth, setViewMonth]       = useState(0);          // index into monthSummaries
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  // Modals
  const [showDateModal, setShowDateModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [editHoliday, setEditHoliday]   = useState(null);
  const [dateForm, setDateForm]         = useState({ startDate: "", endDate: "" });
  const [holidayForm, setHolidayForm]   = useState({
    name: "", date: "", type: "PUBLIC", description: "", semesterNumber: ""
  });
  const [saving, setSaving] = useState(false);

  // ── Load departments ─────────────────────────────────────────────────────
  useEffect(() => {
    axiosClient.get("/departments")
      .then(r => {
        setDepartments(r.data?.content ?? r.data ?? []);
        if ((r.data?.content ?? r.data ?? []).length > 0) {
          setSelDeptId(String((r.data?.content ?? r.data)[0].id));
        }
      })
      .catch(() => setError("Failed to load departments."));
  }, []);

  // ── Load calendars for selected department ───────────────────────────────
  useEffect(() => {
    if (!selDeptId) return;
    setLoading(true); setError("");
    axiosClient.get(`/academic-calendar?departmentId=${selDeptId}`)
      .then(r => {
        setCalendars(r.data);
        if (r.data.length > 0) {
          const cur = r.data.find(c => c.isCurrentSemester) ?? r.data[0];
          setSelSemId(cur.semesterId);
          setSelCal(cur);
          setViewMonth(0);
        }
      })
      .catch(() => setError("Failed to load academic calendars."))
      .finally(() => setLoading(false));
  }, [selDeptId]);

  const selectCalendar = (cal) => {
    setSelSemId(cal.semesterId);
    setSelCal(cal);
    setViewMonth(0);
  };

  // ── Recalculate ──────────────────────────────────────────────────────────
  const handleRecalculate = async () => {
    if (!selSemId) return;
    setLoading(true);
    try {
      const r = await axiosClient.post(`/academic-calendar/semester/${selSemId}/recalculate`);
      setSelCal(r.data);
      setCalendars(prev => prev.map(c => c.semesterId === selSemId ? r.data : c));
    } catch { setError("Recalculation failed."); }
    finally { setLoading(false); }
  };

  // ── Update semester dates ────────────────────────────────────────────────
  const openDateModal = () => {
    setDateForm({ startDate: selCal?.startDate ?? "", endDate: selCal?.endDate ?? "" });
    setShowDateModal(true);
  };
  const saveDates = async () => {
    setSaving(true);
    try {
      const r = await axiosClient.put(
        `/academic-calendar/semester/${selSemId}/dates`,
        { startDate: dateForm.startDate, endDate: dateForm.endDate }
      );
      setSelCal(r.data);
      setCalendars(prev => prev.map(c => c.semesterId === selSemId ? r.data : c));
      setShowDateModal(false);
    } catch { setError("Failed to update dates."); }
    finally { setSaving(false); }
  };

  // ── Holiday CRUD ─────────────────────────────────────────────────────────
  const openAddHoliday = () => {
    setEditHoliday(null);
    setHolidayForm({ name: "", date: "", type: "PUBLIC", description: "", semesterNumber: "" });
    setShowHolidayModal(true);
  };
  const openEditHoliday = (h) => {
    setEditHoliday(h);
    setHolidayForm({
      name: h.name, date: h.date, type: h.type,
      description: h.description ?? "", semesterNumber: h.semesterNumber ?? ""
    });
    setShowHolidayModal(true);
  };
  const saveHoliday = async () => {
    setSaving(true);
    try {
      const payload = { ...holidayForm, semesterNumber: holidayForm.semesterNumber || null };
      if (editHoliday) {
        await axiosClient.put(`/holidays/${editHoliday.id}`, payload);
      } else {
        await axiosClient.post("/holidays", payload);
      }
      await handleRecalculate();
      setShowHolidayModal(false);
    } catch { setError("Failed to save holiday."); }
    finally { setSaving(false); }
  };
  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;
    try {
      await axiosClient.delete(`/holidays/${id}`);
      await handleRecalculate();
    } catch { setError("Failed to delete holiday."); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN",
    { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const month = selCal?.monthSummaries?.[viewMonth];

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Calendar size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f1f5f9" }}>Academic Calendar</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Manage semester schedules, holidays & working days</p>
          </div>
        </div>
        {canEdit && selSemId && (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleRecalculate} style={btnStyle("#1e293b", "#6366f1")}>
              <RefreshCw size={14} /> Recalculate
            </button>
            <button onClick={openDateModal} style={btnStyle("#6366f1", "#818cf8")}>
              <Pencil size={14} /> Edit Dates
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: "#450a0a", border: "1px solid #dc2626", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
          <AlertCircle size={16} color="#f87171" /> <span style={{ color: "#fca5a5", fontSize: 14 }}>{error}</span>
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* ── Department Selector ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <select value={selDeptId} onChange={e => setSelDeptId(e.target.value)} style={selectStyle}>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* ── Semester Tabs ── */}
      {calendars.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
          {calendars.map(cal => (
            <button key={cal.semesterId} onClick={() => selectCalendar(cal)} style={{
              padding: "8px 18px", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              fontWeight: 600, fontSize: 13, transition: "all .2s",
              background: selSemId === cal.semesterId
                ? (cal.isCurrentSemester ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#6366f1,#8b5cf6)")
                : "#1e293b",
              color: selSemId === cal.semesterId ? "#fff" : "#94a3b8",
              boxShadow: selSemId === cal.semesterId ? "0 4px 12px rgba(99,102,241,.4)" : "none",
            }}>
              {cal.isCurrentSemester && "● "}{cal.semesterName}
            </button>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading calendar…</div>}

      {selCal && !loading && (
        <>
          {/* ── Stats Row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
            {[
              { label: "Total Days",    value: selCal.totalCalendarDays, color: "#6366f1", sub: `${fmt(selCal.startDate)} → ${fmt(selCal.endDate)}` },
              { label: "Working Days",  value: selCal.totalWorkingDays,  color: "#10b981", sub: "Mon–Fri, excl. holidays" },
              { label: "Weekend Days",  value: selCal.weekendDays,       color: "#f59e0b", sub: "Sat + Sun" },
              { label: "Total Holidays",value: selCal.totalHolidays,     color: "#ef4444", sub: "On weekdays only" },
            ].map(s => (
              <div key={s.label} style={cardStyle}>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Holiday type breakdown ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
            {[
              { label: "National",   value: selCal.nationalHolidays,  color: "#ef4444" },
              { label: "Public",     value: selCal.publicHolidays,    color: "#f97316" },
              { label: "College",    value: selCal.collegeHolidays,   color: "#8b5cf6" },
              { label: "Exam",       value: selCal.examHolidays,      color: "#3b82f6" },
            ].map(h => (
              <div key={h.label} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: h.color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: h.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: h.color }}>{h.value}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{h.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Sub-tabs ── */}
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#1e293b", borderRadius: 12, padding: 4, width: "fit-content" }}>
            {["calendar", "holidays"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "8px 20px", borderRadius: 9, border: "none", cursor: "pointer", fontWeight: 600,
                fontSize: 13, textTransform: "capitalize",
                background: activeTab === tab ? "#6366f1" : "transparent",
                color: activeTab === tab ? "#fff" : "#94a3b8",
              }}>{tab === "calendar" ? "📅 Calendar View" : "🎌 Holidays"}</button>
            ))}
          </div>

          {/* ══ TAB: Calendar View ══ */}
          {activeTab === "calendar" && selCal.monthSummaries?.length > 0 && (
            <div style={cardStyle}>
              {/* Month navigation */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={() => setViewMonth(v => Math.max(0, v - 1))} disabled={viewMonth === 0}
                  style={{ ...iconBtn, opacity: viewMonth === 0 ? 0.3 : 1 }}><ChevronLeft size={18} /></button>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#f1f5f9" }}>
                    {month?.monthName} {month?.year}
                  </div>
                  <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>
                    🟢 {month?.workingDays} working · 🔴 {month?.weekends} weekends · 🎌 {month?.holidays} holidays
                  </div>
                </div>
                <button onClick={() => setViewMonth(v => Math.min((selCal.monthSummaries?.length ?? 1) - 1, v + 1))}
                  disabled={viewMonth >= (selCal.monthSummaries?.length ?? 1) - 1}
                  style={{ ...iconBtn, opacity: viewMonth >= (selCal.monthSummaries?.length ?? 1) - 1 ? 0.3 : 1 }}>
                  <ChevronRight size={18} /></button>
              </div>

              {/* Day-of-week headers */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                  <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#64748b", padding: "6px 0" }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <CalendarGrid month={month} />

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #334155" }}>
                {Object.entries(DAY_COLORS).filter(([k]) => k !== "OUT_OF_SEMESTER").map(([k, v]) => (
                  <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 4, background: v.bg, border: "1px solid #334155" }} />
                    <span style={{ color: "#94a3b8" }}>{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: Holidays ══ */}
          {activeTab === "holidays" && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                  Holidays for {selCal.semesterName}
                </h3>
                {canEdit && (
                  <button onClick={openAddHoliday} style={btnStyle("#6366f1", "#818cf8")}>
                    <Plus size={14} /> Add Holiday
                  </button>
                )}
              </div>

              {selCal.holidays?.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                  <Calendar size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p>No holidays added yet for this semester.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selCal.holidays?.map(h => {
                    const htype = HOLIDAY_TYPES.find(t => t.value === h.type);
                    return (
                      <div key={h.id} style={{
                        display: "flex", alignItems: "center", gap: 14,
                        background: "#0f172a", borderRadius: 10, padding: "12px 16px",
                        border: `1px solid ${htype?.color}33`,
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: htype?.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {htype && <htype.icon size={18} color={htype.color} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14 }}>{h.name}</div>
                          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                            {fmt(h.date)} · {h.dayOfWeek} · <span style={{ color: htype?.color }}>{h.typeLabel}</span>
                            {h.semesterNumber && <span style={{ marginLeft: 8, color: "#64748b" }}>• Sem {h.semesterNumber} only</span>}
                            {h.description && <span style={{ marginLeft: 8, color: "#64748b" }}>• {h.description}</span>}
                          </div>
                        </div>
                        {canEdit && (
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => openEditHoliday(h)} style={iconBtn}><Pencil size={14} /></button>
                            {["SUPER_ADMIN", "ADMIN"].includes(user?.role) && (
                              <button onClick={() => deleteHoliday(h.id)} style={{ ...iconBtn, color: "#ef4444" }}><Trash2 size={14} /></button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ Modal: Edit Dates ══ */}
      {showDateModal && (
        <Modal title="Update Semester Dates" onClose={() => setShowDateModal(false)}>
          <label style={labelStyle}>Start Date</label>
          <input type="date" value={dateForm.startDate} onChange={e => setDateForm(p => ({ ...p, startDate: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>End Date</label>
          <input type="date" value={dateForm.endDate} onChange={e => setDateForm(p => ({ ...p, endDate: e.target.value }))} style={inputStyle} />
          <div style={{ background: "#1e293b", borderRadius: 8, padding: "10px 14px", marginTop: 8, fontSize: 13, color: "#94a3b8", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Info size={14} style={{ marginTop: 1, flexShrink: 0, color: "#6366f1" }} />
            Working days will be automatically recalculated after saving.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={saveDates} disabled={saving} style={{ ...btnStyle("#6366f1", "#818cf8"), flex: 1 }}>
              {saving ? "Saving…" : <><Save size={14} /> Save & Recalculate</>}
            </button>
            <button onClick={() => setShowDateModal(false)} style={{ ...btnStyle("#1e293b", "#334155"), flex: 1 }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* ══ Modal: Add/Edit Holiday ══ */}
      {showHolidayModal && (
        <Modal title={editHoliday ? "Edit Holiday" : "Add Holiday"} onClose={() => setShowHolidayModal(false)}>
          <label style={labelStyle}>Holiday Name *</label>
          <input placeholder="e.g. Diwali" value={holidayForm.name} onChange={e => setHolidayForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>Date *</label>
          <input type="date" value={holidayForm.date} onChange={e => setHolidayForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
          <label style={labelStyle}>Type *</label>
          <select value={holidayForm.type} onChange={e => setHolidayForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
            {HOLIDAY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label style={labelStyle}>Applies to Semester (leave blank = all semesters)</label>
          <select value={holidayForm.semesterNumber} onChange={e => setHolidayForm(p => ({ ...p, semesterNumber: e.target.value }))} style={inputStyle}>
            <option value="">All Semesters (Global)</option>
            {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>Semester {n}</option>)}
          </select>
          <label style={labelStyle}>Description (optional)</label>
          <input placeholder="Additional notes…" value={holidayForm.description} onChange={e => setHolidayForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} />
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={saveHoliday} disabled={saving} style={{ ...btnStyle("#6366f1", "#818cf8"), flex: 1 }}>
              {saving ? "Saving…" : <><Save size={14} /> Save Holiday</>}
            </button>
            <button onClick={() => setShowHolidayModal(false)} style={{ ...btnStyle("#1e293b", "#334155"), flex: 1 }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Calendar Grid Component ───────────────────────────────────────────────────
function CalendarGrid({ month }) {
  if (!month?.days) return null;

  // Find starting weekday of the month (0=Mon...6=Sun)
  const firstDay = new Date(month.year, month.month - 1, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // convert Sun=0 to Mon=0
  const blanks = Array(startOffset).fill(null);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
      {blanks.map((_, i) => <div key={`b${i}`} />)}
      {month.days.map((day) => {
        const colors = DAY_COLORS[day.dayType] ?? DAY_COLORS.WORKING;
        const d = new Date(day.date);
        const isToday = new Date().toDateString() === d.toDateString();
        return (
          <div key={day.date} title={day.holidayName ?? colors.label} style={{
            aspectRatio: "1", borderRadius: 8,
            background: day.dayType === "OUT_OF_SEMESTER" ? "transparent" : colors.bg,
            border: isToday ? "2px solid #f59e0b" : day.dayType === "OUT_OF_SEMESTER" ? "none" : "1px solid #1e293b",
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", position: "relative", cursor: day.holidayName ? "help" : "default",
            opacity: day.dayType === "OUT_OF_SEMESTER" ? 0.2 : 1,
          }}>
            <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: colors.text }}>
              {d.getDate()}
            </span>
            {day.holidayName && (
              <span style={{ fontSize: 6, color: colors.text, textAlign: "center", lineHeight: 1.2, maxWidth: "90%", overflow: "hidden" }}>
                {day.holidayName.slice(0, 8)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#1e293b", borderRadius: 16, padding: 28, width: "100%", maxWidth: 460, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardStyle = { background: "#1e293b", borderRadius: 14, padding: "18px 20px", border: "1px solid #334155" };
const inputStyle = { width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 14, marginBottom: 14, boxSizing: "border-box", outline: "none" };
const labelStyle = { display: "block", fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".5px" };
const selectStyle = { background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, outline: "none", cursor: "pointer" };
const iconBtn = { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center" };
const btnStyle = (bg, hover) => ({
  background: bg, border: "none", borderRadius: 10, padding: "10px 18px",
  color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 13,
  display: "flex", alignItems: "center", gap: 6,
});
