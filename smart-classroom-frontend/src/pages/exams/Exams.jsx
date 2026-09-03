import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Pencil, Trash2, Eye, Loader2, RefreshCw, BookOpen } from "lucide-react";
import { fetchAllMarks, createMarks, updateMarks, deleteMarks, selectMarks } from "../../store/slices/marksSlice";
import { fetchStudents, selectStudents } from "../../store/slices/studentSlice";
import { fetchSubjects, selectSubjects } from "../../store/slices/subjectSlice";
import { fetchSemesters, selectSemesters } from "../../store/slices/semesterSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";

const EXAM_TYPES = ["INTERNAL","EXTERNAL","ASSIGNMENT","LAB","PRACTICAL","QUIZ","UNIT_TEST","MID_TERM","FINAL"];
const EMPTY = { studentId:"", subjectId:"", semesterId:"", examType:"INTERNAL", marksObtained:"", maxMarks:"", grade:"", remarks:"" };

function avgColor(pct) {
  if (pct >= 80) return "text-green-600";
  if (pct >= 60) return "text-orange-500";
  return "text-red-500";
}

export default function Exams() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(selectMarks);
  const { list: students } = useSelector(selectStudents);
  const { list: subjects } = useSelector(selectSubjects);
  const { list: semesters } = useSelector(selectSemesters);
  const { canAddMarks, canDeleteMarks } = usePermissions();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  useEffect(() => {
    dispatch(fetchAllMarks());
    dispatch(fetchStudents({ page: 0, size: 200 }));
    dispatch(fetchSubjects());
    dispatch(fetchSemesters());
  }, [dispatch]);

  const filtered = list.filter((m) => {
    const matchSearch = `${m.studentName || ""} ${m.subjectName || ""}`.toLowerCase().includes(search.toLowerCase());
    const matchType   = !filterType || m.examType === filterType;
    return matchSearch && matchType;
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (m) => {
    setEditing(m);
    setForm({ studentId: m.studentId||"", subjectId: m.subjectId||"", semesterId: m.semesterId||"", examType: m.examType||"INTERNAL", marksObtained: m.marksObtained||"", maxMarks: m.maxMarks||"", grade: m.grade||"", remarks: m.remarks||"" });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, studentId: Number(form.studentId), subjectId: Number(form.subjectId), semesterId: Number(form.semesterId), marksObtained: Number(form.marksObtained), maxMarks: Number(form.maxMarks) };
    if (editing) await dispatch(updateMarks({ id: editing.id, data: payload }));
    else await dispatch(createMarks(payload));
    setSaving(false); setModalOpen(false);
  };
  const handleDelete = async () => { setDeleting(true); await dispatch(deleteMarks(deleteId)); setDeleting(false); setDeleteId(null); };

  const avgScore = list.length ? (list.reduce((a, m) => a + (m.marksObtained / m.maxMarks * 100), 0) / list.length).toFixed(1) : 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams & Marks</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage exams, grades, and student performance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchAllMarks())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          {canAddMarks && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Marks</button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total Records", value: list.length, color:"text-blue-600", bg:"bg-blue-50" },
          { label:"Avg Score",     value: `${avgScore}%`, color:"text-green-600", bg:"bg-green-50" },
          { label:"Exam Types",    value: EXAM_TYPES.length, color:"text-orange-600", bg:"bg-orange-50" },
          { label:"Subjects",      value: subjects.length, color:"text-purple-600", bg:"bg-purple-50" },
          { label:"Students",      value: students.length, color:"text-cyan-600", bg:"bg-cyan-50" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student or subject..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Exam Types</option>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
          </select>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Subjects</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  {["#","Student","Subject","Exam Type","Marks","Max","%","Grade","Semester","Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
                    No marks records found. Click "Add Marks" to begin.
                  </td></tr>
                ) : filtered.map((m, i) => {
                  const pct = m.maxMarks > 0 ? ((m.marksObtained / m.maxMarks) * 100).toFixed(1) : 0;
                  return (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{m.studentName || `Student #${m.studentId}`}</td>
                      <td className="px-4 py-3 text-gray-600">{m.subjectName || `Subject #${m.subjectId}`}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {(m.examType||"").replace("_"," ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{m.marksObtained}</td>
                      <td className="px-4 py-3 text-gray-500">{m.maxMarks}</td>
                      <td className="px-4 py-3 font-semibold"><span className={avgColor(pct)}>{pct}%</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">{m.grade || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.semesterName || `Sem #${m.semesterId}`}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setViewItem(m)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                          <button onClick={() => openEdit(m)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteId(m.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Marks" : "Add Marks"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Student *</label>
            <select name="studentId" value={form.studentId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Student</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} — {s.rollNumber}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Subject *</label>
              <select name="subjectId" value={form.subjectId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
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
            <label className="text-xs font-medium text-gray-600 mb-1 block">Exam Type *</label>
            <select name="examType" value={form.examType} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              {EXAM_TYPES.map((t) => <option key={t} value={t}>{t.replace("_"," ")}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Marks Obtained *</label>
              <input name="marksObtained" type="number" min="0" step="0.1" value={form.marksObtained} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Max Marks *</label>
              <input name="maxMarks" type="number" min="1" step="0.1" value={form.maxMarks} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Grade</label>
              <input name="grade" value={form.grade} onChange={handleChange} placeholder="A, B+, etc." className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Remarks</label>
              <input name="remarks" value={form.remarks} onChange={handleChange} placeholder="Optional remarks" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : editing ? "Update" : "Add Marks"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Marks Details">
        {viewItem && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className={`text-4xl font-bold ${avgColor((viewItem.marksObtained / viewItem.maxMarks) * 100)}`}>
                {((viewItem.marksObtained / viewItem.maxMarks) * 100).toFixed(1)}%
              </div>
              <div className="text-gray-500 text-sm mt-1">{viewItem.marksObtained} / {viewItem.maxMarks} marks</div>
              {viewItem.grade && <div className="mt-2 inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">Grade: {viewItem.grade}</div>}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l:"Student",   v: viewItem.studentName || `#${viewItem.studentId}` },
                { l:"Subject",   v: viewItem.subjectName || `#${viewItem.subjectId}` },
                { l:"Exam Type", v: (viewItem.examType||"").replace("_"," ") },
                { l:"Semester",  v: viewItem.semesterName || `#${viewItem.semesterId}` },
                { l:"Remarks",   v: viewItem.remarks || "—" },
              ].map((item) => (
                <div key={item.l} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 font-medium">{item.l}</div>
                  <div className="text-gray-800 mt-0.5 font-medium">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Marks" message="This will permanently delete the marks record." />
    </div>
  );
}
