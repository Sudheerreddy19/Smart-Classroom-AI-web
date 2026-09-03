import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Search, Download, Upload, Eye, Clock, Trash2, Users, RefreshCw, Plus, Loader2, CheckCircle } from "lucide-react";
import {
  fetchTodaySessions, fetchSessionAttendance, createSession, closeSession, markAttendance,
  selectAttendance, setCurrentSession,
} from "../../store/slices/attendanceSlice";
import { fetchClassrooms, selectClassrooms } from "../../store/slices/classroomSlice";
import { fetchSubjects, selectSubjects } from "../../store/slices/subjectSlice";
import { fetchTeachers, selectTeachers } from "../../store/slices/teacherSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";

const tabs = ["Live Attendance", "Attendance List", "Reports", "Analytics"];

const statusColor = {
  PRESENT: "bg-green-100 text-green-700",
  LATE:    "bg-yellow-100 text-yellow-700",
  ABSENT:  "bg-red-100 text-red-600",
  EXCUSED: "bg-blue-100 text-blue-600",
};

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
const METHOD_OPTIONS  = ["FACE_RECOGNITION", "MANUAL", "QR_CODE"];

export default function Attendance() {
  const dispatch = useDispatch();
  const { sessions, records, currentSession, loading } = useSelector(selectAttendance);
  const { list: classrooms } = useSelector(selectClassrooms);
  const { list: subjects }   = useSelector(selectSubjects);
  const { list: teachers }   = useSelector(selectTeachers);
  const { canTakeAttendance, canDeleteAttendance, isStudent } = usePermissions();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Live Attendance");
  const [search, setSearch] = useState("");

  /* New Session Modal */
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ classroomId:"", subjectId:"", teacherId:"", sessionDate: new Date().toISOString().split("T")[0], startTime:"09:00" });
  const [creatingSess, setCreatingSess] = useState(false);

  /* Mark Attendance Modal */
  const [markModal, setMarkModal]   = useState(false);
  const [markForm,  setMarkForm]    = useState({ sessionId:"", studentId:"", status:"PRESENT", method:"MANUAL" });
  const [marking, setMarking]       = useState(false);

  /* Close session confirm */
  const [closeId, setCloseId]       = useState(null);
  const [closing, setClosing]       = useState(false);

  useEffect(() => {
    dispatch(fetchTodaySessions());
    dispatch(fetchClassrooms());
    dispatch(fetchSubjects());
    dispatch(fetchTeachers({ page: 0, size: 100 }));
  }, [dispatch]);

  /* Load records when a session is selected */
  const selectSession = (s) => {
    dispatch(setCurrentSession(s));
    dispatch(fetchSessionAttendance(s.id));
  };

  const filteredRecords = records.filter((r) =>
    `${r.studentName || ""} ${r.rollNumber || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Handlers ── */
  const handleStartSession = async (e) => {
    e.preventDefault(); setCreatingSess(true);
    const payload = {
      classroomId: Number(sessionForm.classroomId),
      subjectId:   Number(sessionForm.subjectId),
      teacherId:   Number(sessionForm.teacherId),
      sessionDate: sessionForm.sessionDate,
      startTime:   sessionForm.startTime + ":00",
    };
    const res = await dispatch(createSession(payload));
    if (!res.error) {
      setSessionModal(false);
      dispatch(fetchSessionAttendance(res.payload.id));
    }
    setCreatingSess(false);
  };

  const handleMark = async (e) => {
    e.preventDefault(); setMarking(true);
    await dispatch(markAttendance({ ...markForm, sessionId: Number(markForm.sessionId), studentId: Number(markForm.studentId) }));
    setMarking(false); setMarkModal(false);
  };

  const handleClose = async () => {
    setClosing(true);
    await dispatch(closeSession(closeId));
    setClosing(false); setCloseId(null);
  };

  /* ── Derived stats from currentSession ── */
  const totalStudents  = currentSession?.totalStudents  || records.length;
  const presentCount   = currentSession?.presentCount   || records.filter((r) => r.status === "PRESENT").length;
  const absentCount    = (currentSession?.absentCount)  ?? records.filter((r) => r.status === "ABSENT").length;
  const lateCount      = records.filter((r) => r.status === "LATE").length;
  const attendancePct  = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage student attendance in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { dispatch(fetchTodaySessions()); if (currentSession) dispatch(fetchSessionAttendance(currentSession.id)); }} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          {canTakeAttendance && (
            <button onClick={() => setMarkModal(true)} disabled={!currentSession} className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 disabled:opacity-40">
              <CheckCircle size={15} /> Mark Manually
            </button>
          )}
          {canTakeAttendance && (
            <button onClick={() => navigate("/attendance/report")} className="flex items-center gap-2 text-sm border border-purple-200 text-purple-700 bg-purple-50 rounded-lg px-3 py-2 hover:bg-purple-100">
              📊 Report
            </button>
          )}
          {canTakeAttendance && (
            <button onClick={() => navigate("/attendance/take")} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
              📷 Take Attendance
            </button>
          )}
          {canTakeAttendance && (
            <button onClick={() => setSessionModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              <Plus size={16} /> Start Session
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${activeTab === t ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
      </div>

      {/* Session Selector */}
      {sessions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Sessions:</span>
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition ${currentSession?.id === s.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${s.status === "ACTIVE" ? "bg-green-400" : "bg-gray-400"}`}></span>
                {s.subjectName} — {s.roomNumber} ({s.status})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Session Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label className="text-xs text-gray-500 mb-1 block">Classroom</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">All Classrooms</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Date</label>
            <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div><label className="text-xs text-gray-500 mb-1 block">Status</label>
            <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2">
              <option value="">All</option>
              {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Students", value: totalStudents, icon: Users, bg: "bg-blue-100", ic: "text-blue-600" },
          { label: "Present", value: `${presentCount} (${attendancePct}%)`, icon: Users, bg: "bg-green-100", ic: "text-green-600" },
          { label: "Absent", value: `${absentCount}`, icon: Users, bg: "bg-red-100", ic: "text-red-600" },
          { label: "Late", value: lateCount, icon: Clock, bg: "bg-yellow-100", ic: "text-yellow-600" },
          { label: "Session Status", value: currentSession?.status || "—", icon: Users, bg: "bg-purple-100", ic: "text-purple-600" },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}><Icon size={16} className={s.ic} /></div>
            <div className="text-base font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        );})}
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex items-center justify-between border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-sm">
            {currentSession ? `Session: ${currentSession.subjectName} — ${currentSession.roomNumber}` : "Select a session above"}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..." className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
            <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Upload size={14} /> Import</button>
            <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Download size={14} /> Export</button>
            {canTakeAttendance && currentSession?.status === "ACTIVE" && (
              <button onClick={() => setCloseId(currentSession.id)} className="text-sm bg-orange-50 text-orange-600 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-100">
                Close Session
              </button>
            )}
          </div>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  {["#","Roll No.","Name","Status","Time","Method","Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {!currentSession ? (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    Start or select a session to view attendance
                  </td></tr>
                ) : filteredRecords.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No attendance records yet.</td></tr>
                ) : filteredRecords.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{r.rollNumber || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.studentName || `Student ${r.studentId}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-blue-600 font-medium">{(r.method || "").replace("_", " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                        <button className="p-1 text-yellow-500 hover:bg-yellow-50 rounded"><Clock size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Session Summary */}
        {currentSession && (
          <div className="p-4 bg-blue-50 border-t border-gray-100 rounded-b-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">Session Summary</p>
                <p className="text-xs text-gray-500">{currentSession.subjectName} · {currentSession.startTime ? currentSession.startTime.slice(0,5) : ""} – {currentSession.endTime ? currentSession.endTime.slice(0,5) : "Ongoing"}</p>
              </div>
              <div className="flex gap-6 text-sm">
                <div><span className="text-gray-500">Present </span><span className="font-semibold text-green-600">{presentCount} ({attendancePct}%)</span></div>
                <div><span className="text-gray-500">Absent </span><span className="font-semibold text-red-600">{absentCount}</span></div>
                <div><span className="text-gray-500">Late </span><span className="font-semibold text-yellow-600">{lateCount}</span></div>
              </div>
              <button className="flex items-center gap-2 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
                <Download size={14} /> Full Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Start Session Modal ── */}
      <Modal isOpen={sessionModal} onClose={() => setSessionModal(false)} title="Start Attendance Session" size="md">
        <form onSubmit={handleStartSession} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Classroom *</label>
            <select name="classroomId" value={sessionForm.classroomId} onChange={(e) => setSessionForm((f) => ({ ...f, classroomId: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Classroom</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber} (capacity: {c.capacity})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Subject *</label>
            <select name="subjectId" value={sessionForm.subjectId} onChange={(e) => setSessionForm((f) => ({ ...f, subjectId: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Teacher *</label>
            <select name="teacherId" value={sessionForm.teacherId} onChange={(e) => setSessionForm((f) => ({ ...f, teacherId: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Session Date *</label>
              <input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm((f) => ({ ...f, sessionDate: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Start Time *</label>
              <input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm((f) => ({ ...f, startTime: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setSessionModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={creatingSess} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {creatingSess && <Loader2 size={14} className="animate-spin" />}
              {creatingSess ? "Starting..." : "Start Session"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Manual Mark Modal ── */}
      <Modal isOpen={markModal} onClose={() => setMarkModal(false)} title="Mark Attendance Manually" size="sm">
        <form onSubmit={handleMark} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Session *</label>
            <select value={markForm.sessionId} onChange={(e) => setMarkForm((f) => ({ ...f, sessionId: e.target.value }))} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Session</option>
              {sessions.filter((s) => s.status === "ACTIVE").map((s) => <option key={s.id} value={s.id}>{s.subjectName} — {s.roomNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Student ID *</label>
            <input type="number" value={markForm.studentId} onChange={(e) => setMarkForm((f) => ({ ...f, studentId: e.target.value }))} required placeholder="Enter student ID" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Status *</label>
              <select value={markForm.status} onChange={(e) => setMarkForm((f) => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Method *</label>
              <select value={markForm.method} onChange={(e) => setMarkForm((f) => ({ ...f, method: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                {METHOD_OPTIONS.map((o) => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMarkModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={marking} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {marking && <Loader2 size={14} className="animate-spin" />}
              {marking ? "Marking..." : "Mark"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Close session confirm */}
      <ConfirmDialog
        isOpen={!!closeId}
        onClose={() => setCloseId(null)}
        onConfirm={handleClose}
        loading={closing}
        title="Close Session"
        message="This will close the attendance session. No more attendance can be marked."
        confirmLabel="Close Session"
      />
    </div>
  );
}
