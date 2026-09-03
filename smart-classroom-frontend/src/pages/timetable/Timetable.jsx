import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, CalendarDays } from "lucide-react";
import { fetchTimetables, createTimetable, updateTimetable, deleteTimetable, selectTimetable } from "../../store/slices/timetableSlice";
import { fetchSubjects, selectSubjects } from "../../store/slices/subjectSlice";
import { fetchTeachers, selectTeachers } from "../../store/slices/teacherSlice";
import { fetchClassrooms, selectClassrooms } from "../../store/slices/classroomSlice";
import { fetchSemesters, selectSemesters } from "../../store/slices/semesterSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const DAY_SHORT = { MONDAY:"Mon", TUESDAY:"Tue", WEDNESDAY:"Wed", THURSDAY:"Thu", FRIDAY:"Fri", SATURDAY:"Sat" };

const SLOT_COLORS = [
  "bg-blue-50 border-blue-200 text-blue-700",
  "bg-green-50 border-green-200 text-green-700",
  "bg-purple-50 border-purple-200 text-purple-700",
  "bg-orange-50 border-orange-200 text-orange-700",
  "bg-cyan-50 border-cyan-200 text-cyan-700",
  "bg-pink-50 border-pink-200 text-pink-700",
  "bg-yellow-50 border-yellow-200 text-yellow-700",
  "bg-indigo-50 border-indigo-200 text-indigo-700",
];

const EMPTY = { subjectId:"", teacherId:"", classroomId:"", semesterId:"", dayOfWeek:"MONDAY", startTime:"09:00", endTime:"10:00" };

export default function Timetable() {
  const dispatch = useDispatch();
  const { list, loading }        = useSelector(selectTimetable);
  const { list: subjects }       = useSelector(selectSubjects);
  const { list: teachers }       = useSelector(selectTeachers);
  const { list: classrooms }     = useSelector(selectClassrooms);
  const { list: semesters }      = useSelector(selectSemesters);

  const [semFilter, setSemFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const [view, setView]           = useState("grid"); // grid | list

  useEffect(() => {
    dispatch(fetchTimetables());
    dispatch(fetchSubjects());
    dispatch(fetchTeachers({ page: 0, size: 100 }));
    dispatch(fetchClassrooms());
    dispatch(fetchSemesters());
  }, [dispatch]);

  const filtered = semFilter ? list.filter((t) => String(t.semesterId) === semFilter) : list;

  /* Build week grid: { time_slot -> { DAY -> entry } } */
  const timeSlots = [...new Set(filtered.map((t) => t.startTime))].sort();
  const byDayAndTime = {};
  filtered.forEach((entry) => {
    const key = `${entry.dayOfWeek}__${entry.startTime}`;
    byDayAndTime[key] = entry;
  });

  // Assign consistent colors per subject
  const subjectColors = {};
  let colorIdx = 0;
  filtered.forEach((t) => {
    if (!subjectColors[t.subjectId]) subjectColors[t.subjectId] = SLOT_COLORS[colorIdx++ % SLOT_COLORS.length];
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ subjectId: t.subjectId||"", teacherId: t.teacherId||"", classroomId: t.classroomId||"", semesterId: t.semesterId||"", dayOfWeek: t.dayOfWeek||"MONDAY", startTime: t.startTime?.slice(0,5)||"09:00", endTime: t.endTime?.slice(0,5)||"10:00" });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, subjectId: Number(form.subjectId), teacherId: Number(form.teacherId), classroomId: Number(form.classroomId), semesterId: Number(form.semesterId), startTime: form.startTime + ":00", endTime: form.endTime + ":00" };
    if (editing) await dispatch(updateTimetable({ id: editing.id, data: payload }));
    else await dispatch(createTimetable(payload));
    setSaving(false); setModalOpen(false);
  };
  const handleDelete = async () => { setDeleting(true); await dispatch(deleteTimetable(deleteId)); setDeleting(false); setDeleteId(null); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and manage class schedules.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch(fetchTimetables())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          <select value={semFilter} onChange={(e) => setSemFilter(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button onClick={() => setView("grid")} className={`px-3 py-2 ${view==="grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>Grid</button>
            <button onClick={() => setView("list")} className={`px-3 py-2 ${view==="list" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>List</button>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
            <Plus size={16} /> Add Entry
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total Entries",  value: filtered.length },
          { label:"Subjects",       value: [...new Set(filtered.map((t) => t.subjectId))].length },
          { label:"Teachers",       value: [...new Set(filtered.map((t) => t.teacherId))].length },
          { label:"Classrooms",     value: [...new Set(filtered.map((t) => t.classroomId))].length },
          { label:"Days Covered",   value: [...new Set(filtered.map((t) => t.dayOfWeek))].length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? <PageLoader /> : view === "grid" ? (
        /* ── Grid View ── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <CalendarDays size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No timetable entries yet. Click "Add Entry" to begin.</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-gray-500 font-medium w-32">Time</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-3 py-3 text-center text-gray-700 font-semibold">{DAY_SHORT[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-medium whitespace-nowrap">
                      {slot?.slice(0,5)}
                    </td>
                    {DAYS.map((day) => {
                      const entry = byDayAndTime[`${day}__${slot}`];
                      if (!entry) return <td key={day} className="px-2 py-2"><div className="h-14"></div></td>;
                      const color = subjectColors[entry.subjectId] || SLOT_COLORS[0];
                      return (
                        <td key={day} className="px-2 py-1.5">
                          <div className={`rounded-lg border p-2 ${color} group relative`}>
                            <div className="font-semibold truncate">{entry.subjectName || `Subject ${entry.subjectId}`}</div>
                            <div className="opacity-70 truncate text-xs">{entry.teacherName || ""}</div>
                            <div className="opacity-60 text-xs">● {entry.roomNumber || ""}</div>
                            {/* Quick actions on hover */}
                            <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                              <button onClick={() => openEdit(entry)} className="p-0.5 bg-white/80 rounded hover:bg-white"><Pencil size={10} /></button>
                              <button onClick={() => setDeleteId(entry.id)} className="p-0.5 bg-white/80 rounded hover:bg-white text-red-500"><Trash2 size={10} /></button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── List View ── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  {["#","Day","Subject","Teacher","Classroom","Semester","Start","End","Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400">No entries found.</td></tr>
                ) : filtered.map((t, i) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i+1}</td>
                    <td className="px-4 py-3"><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{DAY_SHORT[t.dayOfWeek]}</span></td>
                    <td className="px-4 py-3 font-medium text-gray-800">{t.subjectName || `Subject ${t.subjectId}`}</td>
                    <td className="px-4 py-3 text-gray-600">{t.teacherName || `Teacher ${t.teacherId}`}</td>
                    <td className="px-4 py-3 text-gray-600">{t.roomNumber || `Room ${t.classroomId}`}</td>
                    <td className="px-4 py-3 text-gray-600">{t.semesterName || `Sem ${t.semesterId}`}</td>
                    <td className="px-4 py-3 text-gray-600">{t.startTime?.slice(0,5)}</td>
                    <td className="px-4 py-3 text-gray-600">{t.endTime?.slice(0,5)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(t)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteId(t.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Timetable Entry" : "Add Timetable Entry"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Subject *</label>
              <select name="subjectId" value={form.subjectId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Teacher *</label>
              <select name="teacherId" value={form.teacherId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Classroom *</label>
              <select name="classroomId" value={form.classroomId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Classroom</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber} (cap: {c.capacity})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Semester *</label>
              <select name="semesterId" value={form.semesterId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Semester</option>
                {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Day *</label>
            <select name="dayOfWeek" value={form.dayOfWeek} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              {DAYS.map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Start Time *</label>
              <input name="startTime" type="time" value={form.startTime} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">End Time *</label>
              <input name="endTime" type="time" value={form.endTime} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Entry" message="Remove this timetable entry?" />
    </div>
  );
}
