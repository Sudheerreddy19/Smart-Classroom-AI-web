import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, StopCircle, Zap, ZapOff, VideoOff, Users } from "lucide-react";
import axiosClient from "../../api/axiosClient";

const CODE_MAP = {
  MARKED:           { emoji:"✅", color:"#16a34a", bg:"#f0fdf4", label:"Present!" },
  DUPLICATE:        { emoji:"🔵", color:"#2563eb", bg:"#eff6ff", label:"Already Marked" },
  NO_FACE:          { emoji:"❌", color:"#dc2626", bg:"#fef2f2", label:"No Face" },
  MULTIPLE_FACES:   { emoji:"⚠️", color:"#d97706", bg:"#fffbeb", label:"Multiple Faces" },
  UNKNOWN:          { emoji:"❓", color:"#6b7280", bg:"#f9fafb", label:"Not Recognised" },
  SESSION_CLOSED:   { emoji:"🔒", color:"#6b7280", bg:"#f9fafb", label:"Session Closed" },
  MARKED_PYTHON_ONLY:{ emoji:"🟡", color:"#b45309", bg:"#fefce8", label:"Marked (unlinked)" },
};

const AUTO_SCAN_MS = 3500;

export default function TakeAttendance() {
  const navigate = useNavigate();
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const timerRef    = useRef(null);
  const sessionRef  = useRef(null);
  const scanningRef = useRef(false);

  const [classrooms, setClassrooms] = useState([]);
  const [subjects,   setSubjects]   = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [form, setForm] = useState({
    classroomId:"", subjectId:"", teacherId:"",
    sessionDate: new Date().toISOString().split("T")[0],
    startTime:   new Date().toTimeString().slice(0,5),
  });

  const [session,  setSession]  = useState(null);
  const [creating, setCreating] = useState(false);
  const [closing,  setClosing]  = useState(false);
  const [camOn,    setCamOn]    = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);

  // Last scan batch results + cumulative present log
  const [lastResults, setLastResults] = useState([]);  // per-scan batch
  const [log,         setLog]         = useState([]);  // all MARKED this session

  useEffect(() => {
    axiosClient.get("/classrooms").then(r => setClassrooms(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    axiosClient.get("/subjects")  .then(r => setSubjects(Array.isArray(r.data)   ? r.data : r.data.content ?? []));
    axiosClient.get("/teachers?page=0&size=200").then(r => setTeachers(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    return () => { stopCamera(); clearTimer(); };
  }, []);

  // Keep refs in sync
  sessionRef.current  = session;
  scanningRef.current = scanning;

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ width:640, height:480, facingMode:"user" } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCamOn(true);
    } catch (e) { toast.error("Camera denied: " + e.message); }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false);
  }, []);

  const captureFrame = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return null;
    c.width = 640; c.height = 480;
    c.getContext("2d").drawImage(v, 0, 0, 640, 480);
    return c.toDataURL("image/jpeg", 0.80);
  }, []);

  // ── Core scan — calls /attendance/face-mark-multi ─────────────────────────
  const doScan = useCallback(async (sess) => {
    const frame = captureFrame();
    if (!frame) return;
    setScanning(true);
    try {
      const { data } = await axiosClient.post("/attendance/face-mark-multi", {
        sessionId:   sess.id,
        imageBase64: frame,
      });

      const results = Array.isArray(data) ? data : [data];
      const ts = new Date().toLocaleTimeString();

      const batch = results.map(r => ({ ...r, ts }));
      setLastResults(batch);

      const newlyMarked = batch.filter(r => r.code === "MARKED");
      if (newlyMarked.length > 0) {
        setLog(prev => [...newlyMarked, ...prev]);
        if (newlyMarked.length === 1) {
          toast.success(`✅ ${newlyMarked[0].studentName} marked Present!`);
        } else {
          toast.success(`✅ ${newlyMarked.length} students marked Present!`);
        }
      }

      const unknowns = batch.filter(r => r.code === "UNKNOWN").length;
      if (unknowns > 0 && newlyMarked.length === 0) {
        // silent — face detected but not enrolled
      }

    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Scan error";
      console.error("Scan error:", msg);
      setLastResults([{ code:"NO_FACE", studentName:"Error", message: msg, ts: new Date().toLocaleTimeString() }]);
    }
    setScanning(false);
  }, [captureFrame]);

  // ── Auto-scan timer ────────────────────────────────────────────────────────
  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  useEffect(() => {
    if (!session || !autoScan || !camOn) { clearTimer(); return; }
    clearTimer();
    timerRef.current = setInterval(() => {
      if (!scanningRef.current && sessionRef.current) doScan(sessionRef.current);
    }, AUTO_SCAN_MS);
    return clearTimer;
  }, [session, autoScan, camOn, doScan]);

  // ── Start session ──────────────────────────────────────────────────────────
  const handleStart = async (e) => {
    e.preventDefault();
    if (!form.classroomId || !form.subjectId || !form.teacherId) { toast.error("Fill all fields."); return; }
    setCreating(true);
    try {
      const { data } = await axiosClient.post("/attendance/session", {
        classroomId: Number(form.classroomId),
        subjectId:   Number(form.subjectId),
        teacherId:   Number(form.teacherId),
        sessionDate: form.sessionDate,
        startTime:   form.startTime + ":00",
      });
      setSession(data);
      await startCamera();
      toast.success("Session started — scanning for all faces every 3.5 s");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start session.");
    }
    setCreating(false);
  };

  const handleClose = async () => {
    setClosing(true); clearTimer();
    try {
      await axiosClient.put(`/attendance/session/${session.id}/close`);
      stopCamera(); setSession(null); setLog([]); setLastResults([]);
      toast.success("Session closed.");
    } catch { toast.error("Failed to close session."); }
    setClosing(false);
  };

  const subjName = subjects.find(s => String(s.id) === String(form.subjectId))?.name || "";
  const roomName = classrooms.find(c => String(c.id) === String(form.classroomId))?.roomNumber || "";
  const marked   = log.length;
  const lastNew  = lastResults.filter(r => r.code === "MARKED").length;

  return (
    <div style={{ padding:24, maxWidth:1160, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:24 }}>
        <div style={{ background:"#eff6ff", borderRadius:12, padding:10 }}><Camera size={24} color="#2563eb"/></div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#111827", margin:0 }}>Multi-Face Attendance</h1>
          <p style={{ color:"#6b7280", fontSize:13, margin:0 }}>Detects all faces in one frame — marks all students simultaneously</p>
        </div>
        <button onClick={() => navigate("/attendance/report")}
          style={{ marginLeft:"auto", background:"#7c3aed", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
          📊 Report
        </button>
      </div>

      {!session ? (
        /* ── Setup ── */
        <div style={{ background:"#fff", borderRadius:16, padding:28, border:"1px solid #e5e7eb", maxWidth:640 }}>
          <h2 style={{ fontWeight:700, fontSize:15, color:"#374151", marginBottom:20 }}>Start Attendance Session</h2>
          <form onSubmit={handleStart}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
              {[
                { label:"Classroom *", name:"classroomId", opts:classrooms, disp: c=>`Room ${c.roomNumber}` },
                { label:"Subject *",   name:"subjectId",   opts:subjects,   disp: s=>s.name },
              ].map(({ label, name, opts, disp })=>(
                <div key={name}>
                  <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>{label}</label>
                  <select name={name} value={form[name]} onChange={e=>setForm(f=>({...f,[e.target.name]:e.target.value}))} required
                    style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #d1d5db", fontSize:13 }}>
                    <option value="">Select…</option>
                    {opts.map(o=><option key={o.id} value={o.id}>{disp(o)}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Teacher *</label>
              <select name="teacherId" value={form.teacherId} onChange={e=>setForm(f=>({...f,teacherId:e.target.value}))} required
                style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #d1d5db", fontSize:13 }}>
                <option value="">Select Teacher</option>
                {teachers.map(t=><option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Date</label>
                <input type="date" value={form.sessionDate} onChange={e=>setForm(f=>({...f,sessionDate:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #d1d5db", fontSize:13 }}/>
              </div>
              <div>
                <label style={{ fontSize:12, fontWeight:500, color:"#374151", display:"block", marginBottom:5 }}>Start Time</label>
                <input type="time" value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:"1px solid #d1d5db", fontSize:13 }}/>
              </div>
            </div>
            <button type="submit" disabled={creating}
              style={{ width:"100%", background:"#2563eb", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
              <Users size={18}/> {creating ? "Starting…" : "▶ Start Multi-Face Session"}
            </button>
          </form>
        </div>

      ) : (
        /* ── Active session ── */
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>

          {/* Camera panel */}
          <div>
            {/* Session bar */}
            <div style={{ background:"#fff", borderRadius:14, padding:"12px 18px", border:"1px solid #e5e7eb", marginBottom:14,
              display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ background:"#f0fdf4", color:"#16a34a", borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:700 }}>● ACTIVE</span>
                <span style={{ fontSize:13, color:"#374151", fontWeight:600 }}>{subjName}</span>
                <span style={{ fontSize:12, color:"#6b7280" }}>Room {roomName} · {form.sessionDate}</span>
                <span style={{ background:"#eff6ff", color:"#2563eb", borderRadius:8, padding:"4px 12px", fontSize:12, fontWeight:700 }}>
                  <Users size={11} style={{ display:"inline", marginRight:4 }}/>{marked} Present
                </span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setAutoScan(a=>!a)}
                  style={{ background: autoScan?"#16a34a":"#6b7280", color:"#fff", border:"none", borderRadius:9, padding:"8px 14px", fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", gap:6, alignItems:"center" }}>
                  {autoScan?<><Zap size={13}/>Auto ON</>:<><ZapOff size={13}/>Auto OFF</>}
                </button>
                <button onClick={handleClose} disabled={closing}
                  style={{ background:"#dc2626", color:"#fff", border:"none", borderRadius:9, padding:"8px 14px", fontWeight:600, fontSize:12, cursor:"pointer", display:"flex", gap:6, alignItems:"center" }}>
                  <StopCircle size={13}/> {closing?"Closing…":"Close Session"}
                </button>
              </div>
            </div>

            {/* Video */}
            <div style={{ position:"relative", background:"#000", borderRadius:14, overflow:"hidden", aspectRatio:"4/3", marginBottom:14 }}>
              <video ref={videoRef} autoPlay playsInline muted
                style={{ width:"100%", height:"100%", objectFit:"cover", display:camOn?"block":"none" }}/>
              <canvas ref={canvasRef} style={{ display:"none" }}/>

              {!camOn && (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#9ca3af" }}>
                  <VideoOff size={40} style={{ marginBottom:10 }}/>
                  <button onClick={startCamera}
                    style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:9, padding:"10px 20px", fontWeight:600, cursor:"pointer" }}>
                    Turn On Camera
                  </button>
                </div>
              )}

              {/* Scanning pulse */}
              {scanning && (
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.25)" }}>
                  <div style={{ padding:"10px 22px", background:"rgba(0,0,0,0.6)", borderRadius:10, color:"#facc15", fontWeight:700, fontSize:14 }}>
                    ⚡ Scanning all faces…
                  </div>
                </div>
              )}

              {/* Auto badge */}
              {autoScan && camOn && !scanning && (
                <div style={{ position:"absolute", bottom:12, left:12, background:"rgba(0,0,0,0.55)", color:"#fff", borderRadius:8, padding:"4px 10px", fontSize:12, fontWeight:600 }}>
                  ⚡ Auto scanning all faces…
                </div>
              )}

              {/* Last scan summary badge */}
              {lastResults.length > 0 && !scanning && (
                <div style={{ position:"absolute", bottom:12, right:12, display:"flex", flexDirection:"column", gap:4, alignItems:"flex-end" }}>
                  {lastNew > 0 && (
                    <div style={{ background:"#f0fdf4", color:"#16a34a", border:"1px solid #86efac", borderRadius:9, padding:"5px 12px", fontSize:12, fontWeight:700 }}>
                      ✅ {lastNew} marked present
                    </div>
                  )}
                  {lastResults.filter(r=>r.code==="UNKNOWN").length > 0 && (
                    <div style={{ background:"#f9fafb", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:9, padding:"5px 12px", fontSize:12 }}>
                      ❓ {lastResults.filter(r=>r.code==="UNKNOWN").length} unknown face(s)
                    </div>
                  )}
                  {lastResults.filter(r=>r.code==="DUPLICATE").length > 0 && (
                    <div style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe", borderRadius:9, padding:"5px 12px", fontSize:12 }}>
                      🔵 {lastResults.filter(r=>r.code==="DUPLICATE").length} already marked
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual scan button */}
            {!autoScan && (
              <button onClick={() => doScan(session)} disabled={scanning || !camOn}
                style={{ width:"100%", background: scanning||!camOn?"#e5e7eb":"#2563eb", color: scanning||!camOn?"#9ca3af":"#fff",
                  border:"none", borderRadius:12, padding:"15px", fontWeight:700, fontSize:16, cursor: scanning||!camOn?"not-allowed":"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:12 }}>
                <Users size={20}/> {scanning?"Scanning all faces…":"📸 Scan All Faces Now"}
              </button>
            )}

            {/* Last scan detail */}
            {lastResults.length > 0 && (
              <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e5e7eb", padding:"14px 18px", marginTop:12 }}>
                <div style={{ fontSize:12, fontWeight:600, color:"#6b7280", marginBottom:10 }}>
                  Last Scan — {lastResults.length} face(s) detected
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {lastResults.map((r,i) => {
                    const cfg = CODE_MAP[r.code] || CODE_MAP.UNKNOWN;
                    return (
                      <div key={i} style={{ background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.color}30`,
                        borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, display:"flex", gap:6, alignItems:"center" }}>
                        {cfg.emoji}
                        <span>{r.studentName || cfg.label}</span>
                        {r.rollNumber && <span style={{ fontWeight:400, opacity:0.7 }}>({r.rollNumber})</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Present log panel */}
          <div style={{ background:"#fff", borderRadius:14, border:"1px solid #e5e7eb", display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <div style={{ background:"#f9fafb", padding:"14px 18px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontWeight:700, fontSize:14, color:"#374151" }}>
                <Users size={14} style={{ display:"inline", marginRight:6, verticalAlign:"middle" }}/>
                Present ({marked})
              </span>
              <button onClick={() => navigate("/attendance/report")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#7c3aed", fontSize:12, fontWeight:600 }}>📊 Report</button>
            </div>
            <div style={{ flex:1, overflowY:"auto", maxHeight:520 }}>
              {log.length === 0 ? (
                <div style={{ padding:32, textAlign:"center", color:"#9ca3af", fontSize:13 }}>
                  <Users size={28} style={{ marginBottom:8, opacity:0.2 }}/>
                  <p style={{ margin:"4px 0" }}>Auto-scanning for faces…</p>
                  <p style={{ margin:0, fontSize:11 }}>All detected students appear here.</p>
                </div>
              ) : log.map((entry,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid #f3f4f6" }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>✅</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:"#111827", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{entry.studentName}</div>
                    <div style={{ fontSize:11, color:"#6b7280" }}>{entry.rollNumber || entry.studentId} · {entry.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 4px rgba(250,204,21,0.3)}50%{box-shadow:0 0 0 12px rgba(250,204,21,0.05)}}`}</style>
    </div>
  );
}