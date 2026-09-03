import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Pencil, Trash2, BookOpen, Loader2, RefreshCw } from "lucide-react";
import { fetchSubjects, createSubject, updateSubject, deleteSubject, selectSubjects } from "../../store/slices/subjectSlice";
import { fetchDepartments, selectDepartments } from "../../store/slices/departmentSlice";
import { fetchSemesters, selectSemesters } from "../../store/slices/semesterSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";

const EMPTY = { name:"", code:"", description:"", credits:"", totalHours:"", semesterId:"", departmentId:"" };

export default function Subjects() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(selectSubjects);
  const { list: depts }   = useSelector(selectDepartments);
  const { list: sems }    = useSelector(selectSemesters);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchDepartments());
    dispatch(fetchSemesters());
  }, [dispatch]);

  const filtered = list.filter((s) =>
    `${s.name} ${s.code} ${s.departmentName || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name||"", code: s.code||"", description: s.description||"", credits: s.credits||"", totalHours: s.totalHours||"", semesterId: s.semesterId||"", departmentId: s.departmentId||"" });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...form, credits: Number(form.credits), totalHours: Number(form.totalHours), semesterId: Number(form.semesterId), departmentId: Number(form.departmentId) };
    if (editing) await dispatch(updateSubject({ id: editing.id, data: payload }));
    else await dispatch(createSubject(payload));
    setSaving(false); setModalOpen(false);
  };
  const handleDelete = async () => {
    setDeleting(true); await dispatch(deleteSubject(deleteId)); setDeleting(false); setDeleteId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Subjects</h1><p className="text-sm text-gray-500 mt-0.5">Manage all subjects and their assignments.</p></div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchSubjects())} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Subject</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          { label:"Total Subjects", value: list.length },
          { label:"Departments",    value: depts.length },
          { label:"Semesters",      value: sems.length },
          { label:"Total Credits",  value: list.reduce((a,s) => a + (s.credits||0), 0) },
          { label:"Total Hours",    value: list.reduce((a,s) => a + (s.totalHours||0), 0) },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-2"><BookOpen size={16} className="text-blue-600" /></div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or code..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2"><option value="">All Departments</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2"><option value="">All Semesters</option>{sems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        </div>
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                {["#","Code","Name","Department","Semester","Credits","Hours","Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No subjects found.</td></tr>
                : filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i+1}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.departmentName||"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.semesterName||"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.credits||"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.totalHours||"—"}</td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button onClick={() => openEdit(s)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(s.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Subject" : "Add Subject"} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Subject Name *</label><input name="name" value={form.name} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Subject Code *</label><input name="code" value={form.code} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="CS401" /></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Credits *</label><input name="credits" type="number" min="1" value={form.credits} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Total Hours</label><input name="totalHours" type="number" min="1" value={form.totalHours} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Department *</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select</option>{depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Semester *</label>
              <select name="semesterId" value={form.semesterId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select</option>{sems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Subject" message="Are you sure you want to delete this subject?" />
    </div>
  );
}
