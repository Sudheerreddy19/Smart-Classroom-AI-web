import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Download, Upload, Plus, Eye, Pencil, Trash2, Users, UserCheck, UserX, BookOpen, Monitor, Loader2, RefreshCw } from "lucide-react";
import { fetchTeachers, createTeacher, updateTeacher, deleteTeacher, selectTeachers } from "../../store/slices/teacherSlice";
import { fetchDepartments, selectDepartments } from "../../store/slices/departmentSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";

const EMPTY = { firstName:"", lastName:"", email:"", password:"", employeeId:"", designation:"", specialization:"", phone:"", departmentId:"" };

export default function TeacherList() {
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector(selectTeachers);
  const { list: depts } = useSelector(selectDepartments);
  const { canCreateTeacher, canEditTeacher, canDeleteTeacher, isSuperAdmin, isAdmin } = usePermissions();
  const showDeptFilter = isSuperAdmin || isAdmin; // HOD/TEACHER get own dept from backend

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedDept, setSelectedDept] = useState(""); // "" = all departments
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewTeacher, setViewTeacher] = useState(null);

  useEffect(() => {
    const params = { page, size: 10 };
    if (selectedDept) params.departmentId = selectedDept;
    dispatch(fetchTeachers(params));
    dispatch(fetchDepartments());
  }, [dispatch, page, selectedDept]);

  const filtered = list.filter((t) =>
    `${t.firstName} ${t.lastName} ${t.employeeId} ${t.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ firstName: t.firstName||"", lastName: t.lastName||"", email: t.email||"", password:"", employeeId: t.employeeId||"", designation: t.designation||"", specialization: t.specialization||"", phone: t.phone||"", departmentId: t.departmentId||"" });
    setModalOpen(true);
  };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, departmentId: Number(form.departmentId) };
    try {
      if (editing) {
        const result = await dispatch(updateTeacher({ id: editing.id, data: payload }));
        if (result.error) { setSaving(false); return; } // toast shown in slice
      } else {
        const result = await dispatch(createTeacher(payload));
        if (result.error) { setSaving(false); return; } // toast shown in slice
      }
      setSaving(false);
      setModalOpen(false);
      // Refresh list
      const params = { page, size: 10 };
      if (selectedDept) params.departmentId = selectedDept;
      dispatch(fetchTeachers(params));
    } catch {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    setDeleting(true); await dispatch(deleteTeacher(deleteId)); setDeleting(false); setDeleteId(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and view all teachers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch(fetchTeachers({ page, size: 10 }))} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          {canCreateTeacher && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg"><Plus size={16} /> Add Teacher</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Teachers", value: pagination.totalElements || list.length, icon: Users, bg: "bg-blue-100", ic: "text-blue-600" },
          { label: "Active", value: list.filter((t) => t.active).length, icon: UserCheck, bg: "bg-green-100", ic: "text-green-600" },
          { label: "Inactive", value: list.filter((t) => !t.active).length, icon: UserX, bg: "bg-red-100", ic: "text-red-600" },
          { label: "Departments", value: depts.length, icon: BookOpen, bg: "bg-orange-100", ic: "text-orange-600" },
          { label: "Page", value: `${page + 1} / ${pagination.totalPages || 1}`, icon: Monitor, bg: "bg-purple-100", ic: "text-purple-600" },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}><Icon size={16} className={s.ic} /></div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        );})}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teacher by name, email, ID..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          {/* Department filter — visible only for SUPER_ADMIN and ADMIN */}
          {showDeptFilter && (
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">All Departments</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2"><option>All Status</option><option>Active</option><option>Inactive</option></select>
          <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Upload size={14} /> Import</button>
          <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Download size={14} /> Export</button>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  {["#","Name","Employee ID","Department","Subjects","Email","Phone","Status","Action"].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No teachers found.</td></tr>
                ) : filtered.map((t, i) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{page * 10 + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-xs font-semibold text-purple-700">{t.firstName?.[0]}{t.lastName?.[0]}</div>
                        <div><div className="font-medium text-gray-800">{t.firstName} {t.lastName}</div><div className="text-xs text-gray-400">{t.designation || "Teacher"}</div></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.employeeId}</td>
                    <td className="px-4 py-3 text-gray-600">{t.departmentName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{t.specialization || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.email}</td>
                    <td className="px-4 py-3 text-gray-600">{t.phone || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{t.active ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setViewTeacher(t)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={14} /></button>
                        {canEditTeacher   && <button onClick={() => openEdit(t)} className="p-1 text-green-500 hover:bg-green-50 rounded"><Pencil size={14} /></button>}
                        {canDeleteTeacher && <button onClick={() => setDeleteId(t.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500">Showing {page*10+1}–{Math.min((page+1)*10, pagination.totalElements || list.length)} of {pagination.totalElements || list.length} teachers</p>
          <div className="flex gap-1">
            <button disabled={page===0} onClick={() => setPage((p) => p-1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">←</button>
            {Array.from({ length: Math.min(pagination.totalPages||1, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`w-8 h-8 text-sm rounded-lg ${page===i ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{i+1}</button>
            ))}
            <button disabled={page>=(pagination.totalPages||1)-1} onClick={() => setPage((p) => p+1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Teacher" : "Add New Teacher"} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">First Name *</label><input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Last Name *</label><input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label><input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">{editing ? "New Password" : "Password *"}</label><input name="password" type="password" value={form.password} onChange={handleChange} required={!editing} minLength={6} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Employee ID *</label><input name="employeeId" value={form.employeeId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label><input name="phone" value={form.phone} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Designation</label><input name="designation" value={form.designation} onChange={handleChange} placeholder="Professor / Lecturer" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
            <div><label className="text-xs font-medium text-gray-600 mb-1 block">Specialization</label><input name="specialization" value={form.specialization} onChange={handleChange} placeholder="Computer Science" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" /></div>
          </div>
          <div><label className="text-xs font-medium text-gray-600 mb-1 block">Department *</label>
            <select name="departmentId" value={form.departmentId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              <option value="">Select Department</option>
              {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
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

      {/* View Modal */}
      <Modal isOpen={!!viewTeacher} onClose={() => setViewTeacher(null)} title="Teacher Details">
        {viewTeacher && (

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-xl font-bold text-purple-700">{viewTeacher.firstName?.[0]}{viewTeacher.lastName?.[0]}</div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewTeacher.firstName} {viewTeacher.lastName}</h3>
                <p className="text-sm text-gray-500">{viewTeacher.employeeId} · {viewTeacher.designation || "Teacher"}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewTeacher.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{viewTeacher.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[{label:"Email",v:viewTeacher.email},{label:"Phone",v:viewTeacher.phone||"—"},{label:"Department",v:viewTeacher.departmentName||"—"},{label:"Specialization",v:viewTeacher.specialization||"—"}].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                  <div className="text-gray-800 mt-0.5 font-medium">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} loading={deleting} title="Delete Teacher" message="This will permanently delete the teacher account and all associated data." />
    </div>
  );
}
