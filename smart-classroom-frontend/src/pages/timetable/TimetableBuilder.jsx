import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Clock, Coffee, BookOpen, Save, ArrowLeft, ArrowRight, CheckCircle2, Settings, Calendar, Trash2 } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };
const COLORS = ["#3b82f6","#16a34a","#7c3aed","#ea580c","#0891b2","#db2777","#ca8a04","#6366f1"];

function toMins(t) { const [h,m] = t.split(":").map(Number); return h*60+m; }
function fromMins(m) { const h=Math.floor(m/60); const min=m%60; return `${String(h).padStart(2,"0")}:${String(min).padStart(2,"0")}`; }

function generateSlots(startTime, endTime, periodMins, breaks) {
  const slots = [];
  let cur = toMins(startTime);
  const end = toMins(endTime);
  while (cur + periodMins <= end) {
    const slotEnd = cur + periodMins;
    const brk = breaks.find(b => toMins(b.start) < slotEnd && toMins(b.end) > cur);
    if (brk) {
      const bStart = toMins(brk.start);
      if (bStart > cur) slots.push({ type:"period", start:fromMins(cur), end:fromMins(bStart) });
      slots.push({ type:"break", label: brk.label, start: brk.start, end: brk.end });
      cur = toMins(brk.end);
    } else {
      slots.push({ type:"period", start:fromMins(cur), end:fromMins(slotEnd) });
      cur = slotEnd;
    }
  }
  return slots;
}

export default function TimetableBuilder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);

  // Step 1: selection
  const [departments, setDepartments] = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [sections,    setSections]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [classrooms,  setClassrooms]  = useState([]);

  const [deptId,  setDeptId]  = useState(params.get("departmentId") || "");
  const [semId,   setSemId]   = useState(params.get("semesterId")   || "");
  const [secId,   setSecId]   = useState(params.get("sectionId")    || "");

  // Step 2: college hours
  const [collegeStart, setCollegeStart] = useState("09:00");
  const [collegeEnd,   setCollegeEnd]   = useState("16:00");
  const [periodMins,   setPeriodMins]   = useState(50);

  // Step 3: breaks
  const [breaks, setBreaks] = useState([
    { label:"Short Break", start:"11:00", end:"11:15" },
    { label:"Lunch Break", start:"13:00", end:"13:45" },
  ]);

  // Step 4: grid filling
  const [slots, setSlots] = useState([]);
  const [grid, setGrid]   = useState({}); // { "MONDAY__09:00": { subjectId, teacherId, classroomId } }
  const [cellModal, setCellModal] = useState(null); // { day, start }
  const [cellForm,  setCellForm]  = useState({ subjectId:"", teacherId:"", classroomId:"" });
  const [includeSat, setIncludeSat] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeDays = includeSat ? DAYS : DAYS.slice(0,5);

  useEffect(() => {
    axiosClient.get("/departments").then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    axiosClient.get("/subjects").then(r  => setSubjects(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    axiosClient.get("/teachers?page=0&size=200").then(r => setTeachers(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    axiosClient.get("/classrooms").then(r => setClassrooms(Array.isArray(r.data) ? r.data : r.data.content ?? []));
  }, []);

  useEffect(() => {
    if (!deptId) { setSemesters([]); return; }
    axiosClient.get(`/semesters/department/${deptId}`).then(r => setSemesters(Array.isArray(r.data) ? r.data : r.data.content ?? []));
  }, [deptId]);

  useEffect(() => {
    if (!deptId || !semId) { setSections([]); return; }
    axiosClient.get(`/sections?departmentId=${deptId}&semesterId=${semId}`).then(r => setSections(Array.isArray(r.data) ? r.data : r.data.content ?? []));
  }, [deptId, semId]);

  const generateGrid = () => {
    const s = generateSlots(collegeStart, collegeEnd, periodMins, breaks);
    setSlots(s);
    setGrid({});
    setStep(4);
  };

  const openCell = (day, slot) => {
    if (slot.type !== "period") return;
    const key = `${day}__${slot.start}`;
    setCellForm(grid[key] || { subjectId:"", teacherId:"", classroomId:"" });
    setCellModal({ day, slot, key });
  };

  const saveCell = () => {
    if (!cellForm.subjectId || !cellForm.teacherId || !cellForm.classroomId) {
      toast.error("Fill all fields."); return;
    }
    setGrid(g => ({ ...g, [cellModal.key]: {...cellForm} }));
    setCellModal(null);
  };

  const clearCell = (key) => setGrid(g => { const n={...g}; delete n[key]; return n; });

  const handleSave = async () => {
    const entries = Object.entries(grid);
    if (entries.length === 0) { toast.error("Fill at least one period."); return; }
    setSaving(true);
    try {
      const requests = entries.map(([key, cell]) => {
        const [day, start] = key.split("__");
        const slot = slots.find(s => s.start === start && s.type === "period");
        return {
          subjectId:   Number(cell.subjectId),
          teacherId:   Number(cell.teacherId),
          classroomId: Number(cell.classroomId),
          semesterId:  Number(semId),
          sectionId:   secId ? Number(secId) : null,
          dayOfWeek:   day,
          startTime:   start + ":00",
          endTime:     (slot?.end || start) + ":00",
        };
      });
      await axiosClient.delete(`/timetables/section/${secId}`).catch(() => {});
      await axiosClient.post("/timetables/bulk", requests);
      toast.success("Timetable saved! " + requests.length + " slots created.");
      navigate("/timetable");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save timetable.");
    } finally { setSaving(false); }
  };

  const selectedSection = sections.find(s => String(s.id) === String(secId));
  const selectedDept    = departments.find(d => String(d.id) === String(deptId));
  const selectedSem     = semesters.find(s => String(s.id) === String(semId));

  const subjectColor = {};
  subjects.forEach((s, i) => { subjectColor[s.id] = COLORS[i % COLORS.length]; });

  const STEP_LABELS = ["Select Section", "College Hours", "Define Breaks", "Fill Timetable", "Save"];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
        <button onClick={() => step > 1 ? setStep(step-1) : navigate("/sections")}
          style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 10 }}><Calendar size={24} color="#7c3aed" /></div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Timetable Builder</h1>
          <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>
            {selectedDept?.name} {selectedSem ? "· Sem " + selectedSem.number : ""} {selectedSection ? "· Section " + selectedSection.name : ""}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 0, marginBottom: 28, background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done   = step > n;
          return (
            <div key={n} style={{ flex: 1, padding: "14px 10px", textAlign: "center", borderRight: n < 5 ? "1px solid #e5e7eb" : "none",
              background: active ? "#7c3aed" : done ? "#f5f3ff" : "#fff" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", margin: "0 auto 4px",
                background: active ? "#fff" : done ? "#7c3aed" : "#e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                color: active ? "#7c3aed" : done ? "#fff" : "#6b7280" }}>
                {done ? <CheckCircle2 size={14} /> : n}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: active ? "#fff" : done ? "#7c3aed" : "#9ca3af" }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* ── STEP 1: Select section ── */}
      {step === 1 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb" }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#374151", marginBottom: 20 }}>Select Department, Semester & Section</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Department", value: deptId, set: setDeptId, opts: departments, display: d => d.name, disabled: false },
              { label: "Semester",   value: semId,  set: setSemId,  opts: semesters,   display: s => "Semester " + s.number, disabled: !deptId },
              { label: "Section",    value: secId,  set: setSecId,  opts: sections,    display: s => "Section " + s.name, disabled: !semId },
            ].map(({ label, value, set, opts, display, disabled }) => (
              <div key={label}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>{label}</label>
                <select value={value} onChange={e => set(e.target.value)} disabled={disabled}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">Select {label}</option>
                  {opts.map(o => <option key={o.id} value={o.id}>{display(o)}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 9, padding: "12px 16px", fontSize: 13, color: "#92400e", marginBottom: 20 }}>
            <strong>Tip:</strong> Go to <em>Section Manager</em> first to create sections and assign students.
          </div>
          <button onClick={() => { if (!deptId || !semId) { toast.error("Select department and semester."); return; } setStep(2); }}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 2: College hours ── */}
      {step === 2 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", maxWidth: 560 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#374151", marginBottom: 20 }}>College Hours & Period Duration</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>College Start Time</label>
              <input type="time" value={collegeStart} onChange={e => setCollegeStart(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #d1d5db", fontSize: 13 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>College End Time</label>
              <input type="time" value={collegeEnd} onChange={e => setCollegeEnd(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #d1d5db", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Period Duration (minutes)</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[45, 50, 55, 60].map(m => (
                <button key={m} onClick={() => setPeriodMins(m)}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: `2px solid ${periodMins === m ? "#7c3aed" : "#e5e7eb"}`,
                    background: periodMins === m ? "#f5f3ff" : "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                    color: periodMins === m ? "#7c3aed" : "#374151" }}>
                  {m}m
                </button>
              ))}
              <input type="number" value={periodMins} onChange={e => setPeriodMins(Number(e.target.value))}
                min={30} max={120} style={{ width: 70, padding: "9px", borderRadius: 9, border: "1px solid #d1d5db", fontSize: 13, textAlign: "center" }} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#374151", marginBottom: 20, cursor: "pointer" }}>
            <input type="checkbox" checked={includeSat} onChange={e => setIncludeSat(e.target.checked)} />
            Include Saturday
          </label>
          <button onClick={() => setStep(3)}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            Next <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 3: Breaks ── */}
      {step === 3 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "1px solid #e5e7eb", maxWidth: 560 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#374151", marginBottom: 6 }}>Define Break Times</h2>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Breaks will appear as greyed-out rows in the timetable grid.</p>
          {breaks.map((brk, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, background: "#f9fafb", borderRadius: 10, padding: "12px 14px" }}>
              <Coffee size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
              <input value={brk.label} onChange={e => setBreaks(b => b.map((x,j) => j===i ? {...x,label:e.target.value} : x))}
                placeholder="Break name" style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13 }} />
              <input type="time" value={brk.start} onChange={e => setBreaks(b => b.map((x,j) => j===i ? {...x,start:e.target.value} : x))}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13 }} />
              <span style={{ color: "#6b7280", fontSize: 12 }}>to</span>
              <input type="time" value={brk.end} onChange={e => setBreaks(b => b.map((x,j) => j===i ? {...x,end:e.target.value} : x))}
                style={{ padding: "7px 10px", borderRadius: 7, border: "1px solid #d1d5db", fontSize: 13 }} />
              <button onClick={() => setBreaks(b => b.filter((_,j) => j!==i))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={() => setBreaks(b => [...b, { label:"Break", start:"12:00", end:"12:15" }])}
            style={{ background: "#f3f4f6", border: "none", borderRadius: 9, padding: "9px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", marginBottom: 24 }}>
            + Add Break
          </button>
          <br />
          <button onClick={generateGrid}
            style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            Generate Grid <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* ── STEP 4: Fill timetable grid ── */}
      {step === 4 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Click any period cell to assign a subject. Filled: {Object.keys(grid).length} slots.</p>
            <button onClick={handleSave} disabled={saving}
              style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Save size={16} /> {saving ? "Saving…" : "Save Timetable"}
            </button>
          </div>
          <div style={{ overflowX: "auto", background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px", background: "#f9fafb", fontSize: 12, fontWeight: 700, color: "#374151", textAlign: "left", borderBottom: "1px solid #e5e7eb", minWidth: 100 }}>Time</th>
                  {activeDays.map(day => (
                    <th key={day} style={{ padding: "12px 16px", background: "#f9fafb", fontSize: 12, fontWeight: 700, color: "#374151", textAlign: "center", borderBottom: "1px solid #e5e7eb", borderLeft: "1px solid #e5e7eb", minWidth: 130 }}>{DAY_SHORT[day]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, si) => (
                  <tr key={si} style={{ background: slot.type === "break" ? "#fffbeb" : si % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280", fontWeight: 600, borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" }}>
                      {slot.start} – {slot.end}
                      {slot.type === "break" && <span style={{ marginLeft: 6, fontSize: 10, background: "#fde68a", color: "#92400e", borderRadius: 4, padding: "1px 5px" }}>{slot.label}</span>}
                    </td>
                    {activeDays.map(day => {
                      if (slot.type === "break") {
                        return <td key={day} style={{ borderBottom: "1px solid #f3f4f6", borderLeft: "1px solid #f3f4f6", background: "#fffbeb" }} />;
                      }
                      const key = `${day}__${slot.start}`;
                      const cell = grid[key];
                      const subj = cell ? subjects.find(s => String(s.id) === String(cell.subjectId)) : null;
                      const tchr = cell ? teachers.find(t => String(t.id) === String(cell.teacherId)) : null;
                      return (
                        <td key={day} onClick={() => openCell(day, slot)}
                          style={{ padding: 6, borderBottom: "1px solid #f3f4f6", borderLeft: "1px solid #f3f4f6", cursor: "pointer", verticalAlign: "top" }}>
                          {cell ? (
                            <div style={{ background: subjectColor[cell.subjectId] + "18", border: `1px solid ${subjectColor[cell.subjectId]}40`, borderLeft: `3px solid ${subjectColor[cell.subjectId]}`, borderRadius: 7, padding: "6px 8px", position: "relative", minHeight: 50 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: subjectColor[cell.subjectId], marginBottom: 2 }}>{subj?.name || "Subject"}</div>
                              <div style={{ fontSize: 10, color: "#6b7280" }}>{tchr ? `${tchr.firstName} ${tchr.lastName}` : ""}</div>
                              <button onClick={e => { e.stopPropagation(); clearCell(key); }}
                                style={{ position: "absolute", top: 3, right: 3, background: "none", border: "none", cursor: "pointer", padding: 2, color: "#dc2626", opacity: 0.6 }}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ height: 50, borderRadius: 7, border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "center", color: "#d1d5db", fontSize: 18, transition: "all 0.1s" }}
                              onMouseEnter={e => e.currentTarget.style.borderColor="#7c3aed"}
                              onMouseLeave={e => e.currentTarget.style.borderColor="#d1d5db"}>
                              +
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cell assignment modal */}
      {cellModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>
              {DAY_SHORT[cellModal.day]} · {cellModal.slot.start} – {cellModal.slot.end}
            </h3>
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 20 }}>Assign subject, teacher, and classroom</p>
            {[
              { label:"Subject",   key:"subjectId",   opts:subjects,   display:s => `${s.name} (${s.code||""})`},
              { label:"Teacher",   key:"teacherId",   opts:teachers,   display:t => `${t.firstName} ${t.lastName}`},
              { label:"Classroom", key:"classroomId", opts:classrooms, display:c => `Room ${c.roomNumber}`},
            ].map(({ label, key, opts, display }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#374151", display: "block", marginBottom: 5 }}>{label}</label>
                <select value={cellForm[key]} onChange={e => setCellForm(f => ({...f, [key]: e.target.value}))}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #d1d5db", fontSize: 13 }}>
                  <option value="">Select {label}</option>
                  {opts.map(o => <option key={o.id} value={o.id}>{display(o)}</option>)}
                </select>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => setCellModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid #e5e7eb", background: "#f9fafb", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCell} style={{ flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Assign Period</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}