import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Pencil, Trash2, Loader2, RefreshCw, Building2 } from "lucide-react";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment, selectDepartments } from "../../store/slices/departmentSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";
import AccessDenied from "../../components/common/AccessDenied";

const EMPTY = { name: "", code: "", description: "" };

export default function Departments() {
  const dispatch = useDispatch();
  const { isHOD, canManageAcademic } = usePermissions();
  const { list, loading } = useSelector(selectDepartments);

  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);

  if (!isHOD) return <AccessDenied />;

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name||"", code: d.code||"", description: d.description||"" }); setModal(true); };
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    if (editing) await dispatch(updateDepartment({ id: editing.id, data: form }));
    else await dispatch(createDepartment(form));
    setSaving(false); setModal(false);
  };

  const handleDelete = async () => {
    setDeleting(true); await dispatch(deleteDepartment(deleteId)); setDeleting(false); setDeleteId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Departments</h1><p className="text-sm text-gray-500">Manage academic departments.</p></div>
        <div className="flex gap-3">
          <button onClick={() => dispatch(fetchDepartments())} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><RefreshCw size={16} /></button>
          {canManageAcademic && <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Department</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[{l:"Total",v:list.length},{l:"Active",v:list.length},{l:"Teachers",v:list.reduce((a,d)=>a+(d.totalTeachers||d.teacherCount||0),0)},{l:"Students",v:list.reduce((a,d)=>a+(d.totalStudents||d.studentCount||0),0)}].map(s => (
          <div key={s.l} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{s.v}</div>
            <div className="text-xs text-gray-500">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                {["#","Code","Department Name","HOD","Teachers","Students","Action"].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {list.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No departments found.</td></tr>
                : list.map((d, i) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{i+1}</td>
                    <td className="px-4 py-3 font-mono text-blue-700 font-semibold">{d.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{d.name}</td>
                    <td className="px-4 py-3 text-gray-600">{d.hodName||"—"}</td>
                    <td className="px-4 py-3 text-gray-600">{d.totalTeachers||d.teacherCount||0}</td>
                    <td className="px-4 py-3 text-gray-600">{d.totalStudents||d.studentCount||0}</td>
                    <td className="px-4 py-3">{canManageAcademic && <div className="flex gap-1">
                      <button onClick={() => openEdit(d)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(d.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                    </div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSave} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Department Name *</label><input name="name" value={form.name} onChange={handleChange} required autoComplete="off" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Code *</label><input name="code" value={form.code} onChange={handleChange} required placeholder="CSE" autoComplete="off" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={2} autoComplete="off" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 resize-none" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}{saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Department" message="Delete this department and all its data?" />
    </div>
  );
}
