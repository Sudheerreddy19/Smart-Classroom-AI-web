import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Users, Plus, ArrowRight, UserCheck, Trash2, BookOpen, RefreshCw } from "lucide-react";
import axiosClient from "../../api/axiosClient";

export default function SectionManager() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [sections,    setSections]    = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [sectionStudents, setSectionStudents] = useState({});
  const [deptId,  setDeptId]  = useState("");
  const [semId,   setSemId]   = useState("");
  const [newSecName, setNewSecName] = useState("");
  const [creatingSection, setCreatingSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState({});

  useEffect(() => {
    axiosClient.get("/departments").then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.content ?? []));
  }, []);

  useEffect(() => {
    if (!deptId) { setSemesters([]); setSemId(""); return; }
    axiosClient.get(`/semesters/department/${deptId}`)
      .then(r => setSemesters(Array.isArray(r.data) ? r.data : r.data.content ?? []));
  }, [deptId]);

  useEffect(() => {
    if (!deptId || !semId) { setSections([]); setAllStudents([]); setSectionStudents({}); return; }
    loadAll();
  }, [deptId, semId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [secRes, stuRes] = await Promise.all([
        axiosClient.get(`/sections?departmentId=${deptId}&semesterId=${semId}`),
        axiosClient.get(`/students?departmentId=${deptId}&semesterId=${semId}&size=200`),
      ]);
      const secs = Array.isArray(secRes.data) ? secRes.data : secRes.data.content ?? [];
      const stus = Array.isArray(stuRes.data) ? stuRes.data : stuRes.data.content ?? [];
      setSections(secs);
      const bySection = {};
      await Promise.all(secs.map(async (sec) => {
        try {
          const r = await axiosClient.get(`/students/by-section/${sec.id}`);
          bySection[sec.id] = Array.isArray(r.data) ? r.data : r.data.content ?? [];
        } catch { bySection[sec.id] = []; }
      }));
      setSectionStudents(bySection);
      const assignedIds = new Set(Object.values(bySection).flat().map(s => s.id));
      setAllStudents(stus.filter(s => !assignedIds.has(s.id)));
    } catch { toast.error("Failed to load data."); }
    finally { setLoading(false); }
  };

  const createSection = async () => {
    if (!newSecName.trim()) { toast.error("Enter section name."); return; }
    setCreatingSection(true);
    try {
      await axiosClient.post("/sections", { name: newSecName.trim(), department: { id: Number(deptId) }, semester: { id: Number(semId) } });
      setNewSecName("");
      toast.success("Section " + newSecName + " created.");
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create section."); }
    finally { setCreatingSection(false); }
  };

  const assignToSection = async (studentId, sectionId) => {
    setAssigning(a => ({...a, [studentId]: true}));
    try {
      await axiosClient.patch(`/students/${studentId}/assign-section`, { sectionId: Number(sectionId) });
      toast.success("Student assigned.");
      loadAll();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to assign."); }
    finally { setAssigning(a => ({...a, [studentId]: false})); }
  };

  const removeFromSection = async (studentId) => {
    try {
      await axiosClient.patch(`/students/${studentId}/assign-section`, { sectionId: null });
      toast.success("Student removed from section.");
      loadAll();
    } catch { toast.error("Failed to remove."); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 10 }}><Users size={24} color="#2563eb" /></div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Section Manager</h1>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Assign students to sections (A, B, C…)</p>
          </div>
        </div>
        <button onClick={() => navigate("/timetable/builder")}
          style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", gap: 8, alignItems: "center" }}>
          <BookOpen size={15} /> Build Timetable <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "1px solid #e5e7eb", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Department</label>
          <select value={deptId} onChange={e => setDeptId(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, minWidth: 180 }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Semester</label>
          <select value={semId} onChange={e => setSemId(e.target.value)} disabled={!deptId}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, minWidth: 150 }}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
          </select>
        </div>
        {deptId && semId && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={newSecName} onChange={e => setNewSecName(e.target.value.toUpperCase())}
              placeholder="New section (A, B…)" maxLength={5}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, width: 160 }} />
            <button onClick={createSection} disabled={creatingSection}
              style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
              <Plus size={14} /> {creatingSection ? "Creating…" : "Add Section"}
            </button>
            <button onClick={loadAll} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
              <RefreshCw size={14} color="#6b7280" />
            </button>
          </div>
        )}
      </div>

      {!deptId || !semId ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <Users size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>Select a Department and Semester to manage sections.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ background: "#f9fafb", padding: "14px 18px", borderBottom: "1px solid #e5e7eb" }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: "#374151", margin: 0 }}>Unassigned Students ({allStudents.length})</h3>
            </div>
            {allStudents.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                <UserCheck size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>All students are assigned!</p>
              </div>
            ) : (
              <div style={{ maxHeight: 500, overflowY: "auto" }}>
                {allStudents.map(st => (
                  <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>
                      {(st.firstName?.[0] || "?")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{st.firstName} {st.lastName}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>{st.rollNumber}</div>
                    </div>
                    <select onChange={e => { if (e.target.value) assignToSection(st.id, e.target.value); }}
                      defaultValue="" disabled={assigning[st.id]}
                      style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, border: "1px solid #d1d5db", cursor: "pointer" }}>
                      <option value="">Assign to…</option>
                      {sections.map(sec => <option key={sec.id} value={sec.id}>Section {sec.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {sections.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 32, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                No sections yet. Create one above.
              </div>
            ) : sections.map(sec => {
              const students = sectionStudents[sec.id] || [];
              return (
                <div key={sec.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
                  <div style={{ background: "#f0fdf4", padding: "12px 18px", borderBottom: "1px solid #dcfce7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: "#16a34a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15 }}>
                        {sec.name}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#15803d" }}>Section {sec.name}</div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>{students.length} students</div>
                      </div>
                    </div>
                    <button onClick={() => navigate("/timetable/builder?sectionId=" + sec.id + "&semesterId=" + semId + "&departmentId=" + deptId)}
                      style={{ fontSize: 12, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 7, padding: "6px 12px", fontWeight: 600, cursor: "pointer" }}>
                      Build Timetable
                    </button>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    {students.length === 0 ? (
                      <div style={{ padding: "16px", textAlign: "center", color: "#9ca3af", fontSize: 12 }}>No students yet</div>
                    ) : students.map(st => (
                      <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderBottom: "1px solid #f3f4f6" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                          {st.firstName?.[0] || "?"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{st.firstName} {st.lastName}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{st.rollNumber}</div>
                        </div>
                        <button onClick={() => removeFromSection(st.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}