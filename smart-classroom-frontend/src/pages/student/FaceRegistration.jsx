import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Camera, Users, CheckCircle2, XCircle, RefreshCw,
  Building2, BookOpen, User, AlertTriangle,
  Play, Clock, Award, ChevronRight
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

const STATUS_COLORS = {
  NOT_REGISTERED:  { bg: "#fef2f2", text: "#dc2626", label: "Not Registered" },
  ACCOUNT_CREATED: { bg: "#eff6ff", text: "#2563eb", label: "Account Created" },
  FACE_REGISTERED: { bg: "#f0fdf4", text: "#16a34a", label: "Face Registered" },
};

export default function FaceRegistration() {
  const [departments, setDepartments] = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [students,    setStudents]    = useState([]);

  const [selDept, setSelDept] = useState("");
  const [selSem,  setSelSem]  = useState("");

  const [loading, setLoading]       = useState(false);
  const [capturing, setCapturing]   = useState(false);
  const [captureId, setCaptureId]   = useState(null);  // student being captured
  const [captureResult, setCaptureResult] = useState(null);

  // ── Load departments ────────────────────────────────────────
  useEffect(() => {
    axiosClient.get("/departments").then(({ data }) => {
      setDepartments(Array.isArray(data) ? data : data.content ?? []);
    }).catch(() => toast.error("Failed to load departments."));
  }, []);

  // ── Load semesters when dept changes ─────────────────────
  useEffect(() => {
    if (!selDept) { setSemesters([]); setSelSem(""); return; }
    axiosClient.get(`/semesters/department/${selDept}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        list.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
        setSemesters(list);
        setSelSem("");
      })
      .catch(() => toast.error("Failed to load semesters."));
  }, [selDept]);

  // ── Load students when dept + sem selected ───────────────
  useEffect(() => {
    if (!selDept || !selSem) { setStudents([]); return; }
    setLoading(true);
    axiosClient.get(`/students/department/${selDept}/semester/${selSem}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        setStudents(list);
      })
      .catch(() => toast.error("Failed to load students."))
      .finally(() => setLoading(false));
  }, [selDept, selSem]);

  // ── Trigger face capture ──────────────────────────────────
  const handleCaptureFace = async (student) => {
    if (student.registrationStatus === "NOT_REGISTERED") {
      toast.error("Student must create their account first before face registration.");
      return;
    }
    if (student.registrationStatus === "FACE_REGISTERED") {
      const reCapture = window.confirm(
        `${student.firstName} ${student.lastName} already has face data. Re-capture and overwrite?`
      );
      if (!reCapture) return;
    }

    setCaptureId(student.id);
    setCapturing(true);
    setCaptureResult(null);

    try {
      const { data } = await axiosClient.post(`/faces/register/${student.id}`);
      setCaptureResult({ ...data, studentName: `${student.firstName} ${student.lastName}` });

      if (data.success) {
        toast.success(`Face registered for ${student.firstName}!`);
        // Update student in list
        setStudents(prev => prev.map(s =>
          s.id === student.id
            ? { ...s, registrationStatus: "FACE_REGISTERED" }
            : s
        ));
      } else {
        toast.error(data.message || "Face capture failed.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Face capture service error. Is the Python service running?";
      toast.error(msg);
      setCaptureResult({ success: false, message: msg });
    } finally {
      setCapturing(false);
      setCaptureId(null);
    }
  };

  // Stats
  const stats = {
    total:       students.length,
    notReg:      students.filter(s => s.registrationStatus === "NOT_REGISTERED").length,
    acctCreated: students.filter(s => s.registrationStatus === "ACCOUNT_CREATED").length,
    faceReg:     students.filter(s => s.registrationStatus === "FACE_REGISTERED").length,
  };

  return (
    <div className="fr-page">
      {/* Header */}
      <div className="fr-header">
        <div className="fr-header-icon"><Camera size={28} /></div>
        <div>
          <h1 className="fr-title">Face Registration</h1>
          <p className="fr-sub">Select a batch and capture face encodings for each student.</p>
        </div>
      </div>

      {/* How It Works */}
      <div className="fr-how">
        {[
          ["1", "Select Department + Semester", Building2],
          ["2", "Choose a student from the list", Users],
          ["3", "Click Capture Face", Camera],
          ["4", "Webcam opens automatically (25 images)", Play],
        ].map(([num, text, Icon]) => (
          <div key={num} className="fr-how-step">
            <div className="fr-how-num">{num}</div>
            <Icon size={16} />
            <span>{text}</span>
          </div>
        ))}
      </div>
      {/* Python Service Setup Banner */}
      <PythonSetupBanner />

      {/* Filters */}
      <div className="fr-filters">
        <div className="fr-filter-group">
          <label><Building2 size={14} /> Department</label>
          <select value={selDept} onChange={e => { setSelDept(e.target.value); setSelSem(""); }}>
            <option value="">Select Department</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <ChevronRight size={20} className="fr-arrow" />
        <div className="fr-filter-group">
          <label><BookOpen size={14} /> Semester</label>
          <select value={selSem} onChange={e => setSelSem(e.target.value)} disabled={!selDept}>
            <option value="">Select Semester</option>
            {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      {students.length > 0 && (
        <div className="fr-stats">
          {[
            { label: "Total", val: stats.total,       color: "#6366f1" },
            { label: "Not Registered", val: stats.notReg,    color: "#ef4444" },
            { label: "Account Created", val: stats.acctCreated, color: "#3b82f6" },
            { label: "Face Registered", val: stats.faceReg,   color: "#22c55e" },
          ].map(({ label, val, color }) => (
            <div key={label} className="fr-stat" style={{ borderLeft: `4px solid ${color}` }}>
              <div className="fr-stat-num" style={{ color }}>{val}</div>
              <div className="fr-stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Python service warning */}
      <div className="fr-warn">
        <AlertTriangle size={16} />
        <span>The Python face service must be running on <strong>localhost:8000</strong> before capturing. See <code>ai-face-service/README.md</code>.</span>
      </div>

      {/* Capture Result */}
      {captureResult && (
        <div className={`fr-result ${captureResult.success ? "fr-result--ok" : "fr-result--err"}`}>
          {captureResult.success
            ? <CheckCircle2 size={20} />
            : <XCircle size={20} />}
          <div>
            <strong>{captureResult.success ? "Face Registered!" : "Capture Failed"}</strong>
            <span> — {captureResult.message}</span>
            {captureResult.success && (
              <span className="fr-result-detail"> ({captureResult.imagesCaptured} images captured)</span>
            )}
          </div>
        </div>
      )}

      {/* Student List */}
      {loading ? (
        <div className="fr-loading"><RefreshCw size={24} className="fr-spin" /> Loading students…</div>
      ) : !selDept || !selSem ? (
        <div className="fr-empty">
          <Camera size={48} className="fr-empty-icon" />
          <p>Select a Department and Semester to view students.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="fr-empty">
          <Users size={48} className="fr-empty-icon" />
          <p>No students found in this batch.</p>
        </div>
      ) : (
        <div className="fr-table-wrap">
          <table className="fr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Student</th>
                <th>Roll Number</th>
                <th>Section</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const statusCfg = STATUS_COLORS[s.registrationStatus] || STATUS_COLORS.NOT_REGISTERED;
                const isCapturing = capturing && captureId === s.id;
                const canCapture  = s.registrationStatus !== "NOT_REGISTERED";

                return (
                  <tr key={s.id} className={isCapturing ? "fr-row--capturing" : ""}>
                    <td className="fr-td-num">{i + 1}</td>
                    <td>
                      <div className="fr-student-cell">
                        <div className="fr-avatar">
                          <User size={16} />
                        </div>
                        <div>
                          <div className="fr-name">{s.firstName} {s.lastName}</div>
                          <div className="fr-email">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code className="fr-roll">{s.rollNumber}</code></td>
                    <td>{s.sectionName || "—"}</td>
                    <td>
                      <span className="fr-status" style={{ background: statusCfg.bg, color: statusCfg.text }}>
                        {s.registrationStatus === "FACE_REGISTERED" && <Award size={12} />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td>
                      {canCapture ? (
                        <button
                          className={`fr-capture-btn ${s.registrationStatus === "FACE_REGISTERED" ? "fr-capture-btn--re" : "fr-capture-btn--new"}`}
                          onClick={() => handleCaptureFace(s)}
                          disabled={capturing}
                        >
                          {isCapturing
                            ? <><RefreshCw size={14} className="fr-spin" /> Capturing…</>
                            : <><Camera size={14} /> {s.registrationStatus === "FACE_REGISTERED" ? "Re-Capture" : "Capture Face"}</>}
                        </button>
                      ) : (
                        <span className="fr-no-acct">Account not created</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .fr-page {
          padding: 2rem;
          max-width: 1100px;
          margin: 0 auto;
          display: flex; flex-direction: column; gap: 1.5rem;
          font-family: 'Inter', sans-serif;
        }

        .fr-header { display: flex; align-items: center; gap: 1rem; }
        .fr-header-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .fr-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
        .fr-sub   { color: #64748b; margin: 4px 0 0; font-size: 0.9rem; }

        .fr-how {
          display: flex; gap: 1rem;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 1rem 1.5rem;
          overflow-x: auto;
        }
        .fr-how-step {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.82rem; color: #475569; white-space: nowrap;
        }
        .fr-how-num {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-weight: 700; font-size: 0.72rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .fr-filters {
          display: flex; align-items: flex-end; gap: 0.75rem;
          background: white; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 1.25rem 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .fr-filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .fr-filter-group label {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 600; color: #475569;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fr-filter-group select {
          padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 0.88rem; color: #1e293b; background: #f8fafc;
          outline: none; cursor: pointer; transition: border-color 0.2s;
          font-family: inherit;
        }
        .fr-filter-group select:focus { border-color: #6366f1; background: white; }
        .fr-filter-group select:disabled { opacity: 0.5; cursor: not-allowed; }
        .fr-arrow { color: #cbd5e1; flex-shrink: 0; }

        .fr-stats {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        }
        .fr-stat {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 12px; padding: 1rem 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .fr-stat-num   { font-size: 1.75rem; font-weight: 800; }
        .fr-stat-label { font-size: 0.78rem; color: #64748b; font-weight: 500; }

        .fr-warn {
          display: flex; align-items: center; gap: 10px;
          background: #fefce8; border: 1px solid #fde047;
          border-radius: 12px; padding: 0.875rem 1.25rem;
          font-size: 0.83rem; color: #92400e;
        }
        .fr-warn code { background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px; }

        .fr-result {
          display: flex; align-items: center; gap: 12px;
          border-radius: 12px; padding: 1rem 1.25rem;
          font-size: 0.88rem;
        }
        .fr-result--ok  { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
        .fr-result--err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; }
        .fr-result-detail { opacity: 0.7; }

        .fr-loading {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 3rem; color: #64748b; font-size: 0.9rem;
        }
        .fr-empty {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 1rem; padding: 4rem;
          color: #94a3b8;
        }
        .fr-empty-icon { opacity: 0.4; }
        .fr-empty p { margin: 0; font-size: 0.9rem; }

        .fr-table-wrap {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        .fr-table { width: 100%; border-collapse: collapse; }
        .fr-table thead tr {
          background: #f8fafc; border-bottom: 1px solid #e2e8f0;
        }
        .fr-table th {
          padding: 12px 16px; text-align: left;
          font-size: 0.75rem; font-weight: 700; color: #64748b;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
        .fr-table tbody tr {
          border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
        }
        .fr-table tbody tr:hover { background: #f8fafc; }
        .fr-table tbody tr:last-child { border-bottom: none; }
        .fr-row--capturing { background: #eff6ff !important; }
        .fr-table td { padding: 12px 16px; vertical-align: middle; }
        .fr-td-num { color: #94a3b8; font-size: 0.83rem; font-weight: 500; }

        .fr-student-cell { display: flex; align-items: center; gap: 10px; }
        .fr-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .fr-name  { font-weight: 600; color: #1e293b; font-size: 0.9rem; }
        .fr-email { font-size: 0.78rem; color: #94a3b8; }
        .fr-roll  { background: #f1f5f9; padding: 3px 8px; border-radius: 6px; font-size: 0.82rem; color: #475569; }

        .fr-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 99px; font-size: 0.78rem; font-weight: 600;
        }

        .fr-capture-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px; border: none;
          cursor: pointer; font-family: inherit; font-size: 0.82rem; font-weight: 600;
          transition: all 0.15s;
        }
        .fr-capture-btn--new {
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white;
        }
        .fr-capture-btn--new:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14,165,233,0.4); }
        .fr-capture-btn--re {
          background: #fef9c3; color: #92400e; border: 1px solid #fde047;
        }
        .fr-capture-btn--re:hover:not(:disabled) { background: #fef08a; }
        .fr-capture-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .fr-no-acct { font-size: 0.78rem; color: #94a3b8; font-style: italic; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .fr-spin { animation: spin 1s linear infinite; }

        @media (max-width: 768px) {
          .fr-stats { grid-template-columns: repeat(2, 1fr); }
          .fr-filters { flex-direction: column; }
          .fr-arrow { transform: rotate(90deg); }
        }
      `}</style>
    </div>
  );
}

// ── Python Service Setup Banner ───────────────────────────────────────────────
function PythonSetupBanner() {
  const [open, setOpen] = useState(false);
  const [serviceUp, setServiceUp] = useState(null);

  const checkService = async () => {
    try {
      const r = await fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(3000) });
      setServiceUp(r.ok);
    } catch {
      setServiceUp(false);
    }
  };

  const borderColor = serviceUp === true ? "#16a34a" : serviceUp === false ? "#dc2626" : "#6366f1";
  const bgColor     = serviceUp === true ? "#052e16" : serviceUp === false ? "#450a0a" : "#1e1b4b";

  return (
    <div style={{ background: bgColor, border: `1px solid ${borderColor}`, borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🐍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#e2e8f0" }}>
              Python AI Face Service
              {serviceUp === true  && <span style={{ marginLeft: 8, color: "#4ade80", fontSize: 12 }}>● Running</span>}
              {serviceUp === false && <span style={{ marginLeft: 8, color: "#f87171", fontSize: 12 }}>● Not Running</span>}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Must be running on <code style={{ color: "#a5b4fc" }}>http://localhost:8000</code> before clicking Capture Face
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={checkService} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Check Status
          </button>
          <button onClick={() => setOpen(o => !o)} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {open ? "Hide Setup" : "▶ How to Start"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 16, borderTop: "1px solid #334155", paddingTop: 16 }}>
          <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>
            Open <strong style={{ color: "#e2e8f0" }}>PowerShell</strong> (search in Start menu) and run these commands one by one:
          </p>
          {[
            { step: "1", title: "Navigate to the AI service folder",             cmd: "cd C:\\Users\\SUDHEER\\Downloads\\AiClass\\ai-face-service" },
            { step: "2", title: "Create virtual environment (first time only)",  cmd: "python -m venv venv" },
            { step: "3", title: "Activate virtual environment",                  cmd: "venv\\Scripts\\activate" },
            { step: "4", title: "Install dependencies (first time only — ~2 min)", cmd: "pip install fastapi uvicorn opencv-python numpy" },
            { step: "5", title: "Install face-recognition (first time — ~5 min)", cmd: "pip install cmake dlib face-recognition" },
            { step: "6", title: "🚀 Start the AI service",                        cmd: "uvicorn main:app --host 0.0.0.0 --port 8000 --reload" },
          ].map(({ step, title, cmd }) => (
            <div key={step} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
                <span style={{ background: "#6366f1", color: "#fff", borderRadius: 4, padding: "1px 7px", fontSize: 11, fontWeight: 700, marginRight: 8 }}>{step}</span>
                {title}
              </div>
              <div style={{ background: "#0f172a", borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: "#a5b4fc", border: "1px solid #334155", wordBreak: "break-all" }}>
                {cmd}
              </div>
            </div>
          ))}
          <div style={{ background: "#172554", borderRadius: 8, padding: "12px 14px", marginTop: 12, fontSize: 12, color: "#93c5fd", lineHeight: 1.7 }}>
            <strong>✅ Success message:</strong> <code>Uvicorn running on http://0.0.0.0:8000</code>
            <br />After seeing this, click <strong>Check Status</strong> above — it should show <span style={{ color: "#4ade80" }}>● Running</span>.
            <br /><strong>⚠️ Keep this PowerShell window open</strong> while using Face Registration.
          </div>
        </div>
      )}
    </div>
  );
}
