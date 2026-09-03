import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Download, Upload, Plus, Eye, Pencil, Trash2, Users, UserCheck, UserX, Loader2, RefreshCw } from "lucide-react";
import { fetchStudents, createStudent, updateStudent, deleteStudent, selectStudents } from "../../store/slices/studentSlice";
import { fetchDepartments, selectDepartments } from "../../store/slices/departmentSlice";
import { fetchSemesters, selectSemesters } from "../../store/slices/semesterSlice";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";
import axiosClient from "../../api/axiosClient";

const EMPTY_FORM = {
  firstName: "", lastName: "", email: "", password: "",
  rollNumber: "", departmentId: "", semesterId: "",
  phone: "", address: "", guardianName: "", guardianPhone: "",
  dateOfBirth: "", profileImage: "",
};

const tabs = ["All Students", "Active", "Inactive", "By Class", "By Subject"];

export default function StudentList() {
  const dispatch = useDispatch();
  const { list, loading, pagination } = useSelector(selectStudents);
  const { list: departments } = useSelector(selectDepartments);
  const { list: semesters } = useSelector(selectSemesters);
  const { canCreateStudent, canEditStudent, canDeleteStudent, isSuperAdmin, isAdmin } = usePermissions();
  const showDeptFilter = isSuperAdmin || isAdmin;

  const [activeTab, setActiveTab] = useState("All Students");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedDept, setSelectedDept] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Filtered semesters based on selected department in form ──────────────
  const [filteredSemesters, setFilteredSemesters] = useState([]);
  const [semLoading, setSemLoading] = useState(false);

  useEffect(() => {
    if (!form.departmentId) {
      setFilteredSemesters([]);
      return;
    }
    setSemLoading(true);
    axiosClient.get(`/semesters/department/${form.departmentId}`)
      .then(r => setFilteredSemesters(
        [...(r.data ?? [])].sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
      ))
      .catch(() => setFilteredSemesters([]))
      .finally(() => setSemLoading(false));
  }, [form.departmentId]);

  // Delete dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View modal
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    const params = { page, size: 10 };
    if (selectedDept) params.departmentId = selectedDept;
    dispatch(fetchStudents(params));
    dispatch(fetchDepartments());
    dispatch(fetchSemesters());
  }, [dispatch, page, selectedDept]);

  const filtered = list.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.rollNumber} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingStudent(null); setForm(EMPTY_FORM); setFilteredSemesters([]); setModalOpen(true); };
  const openEdit = (s) => {
    setEditingStudent(s);
    setForm({
      firstName: s.firstName || "", lastName: s.lastName || "",
      email: s.email || "", password: "",
      rollNumber: s.rollNumber || "",
      departmentId: s.departmentId || "", semesterId: s.semesterId || "",
      phone: s.phone || "", address: s.address || "",
      guardianName: s.guardianName || "", guardianPhone: s.guardianPhone || "",
      dateOfBirth: s.dateOfBirth || "", profileImage: s.profileImage || "",
    });
    setModalOpen(true);
  };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      departmentId: Number(form.departmentId),
      semesterId: Number(form.semesterId),
    };
    if (editingStudent) {
      await dispatch(updateStudent({ id: editingStudent.id, data: payload }));
    } else {
      await dispatch(createStudent(payload));
    }
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await dispatch(deleteStudent(deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  const activeCount = list.filter((s) => s.active).length;
  const inactiveCount = list.filter((s) => !s.active).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and view all registered students.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => {
            const params = { page, size: 10 };
            if (selectedDept) params.departmentId = selectedDept;
            dispatch(fetchStudents(params));
          }} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50" title="Refresh">
            <RefreshCw size={16} />
          </button>
          {canCreateStudent && (
            <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              <Plus size={16} /> Add Student
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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Students", value: pagination.totalElements || list.length, icon: Users, bg: "bg-blue-100", ic: "text-blue-600" },
          { label: "Active", value: activeCount, sub: list.length ? `${((activeCount/list.length)*100).toFixed(1)}%` : "0%", icon: UserCheck, bg: "bg-green-100", ic: "text-green-600" },
          { label: "Inactive", value: inactiveCount, sub: list.length ? `${((inactiveCount/list.length)*100).toFixed(1)}%` : "0%", icon: UserX, bg: "bg-red-100", ic: "text-red-600" },
          { label: "Departments", value: departments.length, icon: Users, bg: "bg-orange-100", ic: "text-orange-600" },
          { label: "Semesters", value: semesters.length, icon: Users, bg: "bg-purple-100", ic: "text-purple-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center mb-2`}><Icon size={16} className={s.ic} /></div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
              {s.sub && <div className="text-xs text-green-600 font-medium mt-0.5">{s.sub}</div>}
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 flex flex-wrap gap-3 border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, roll, email..." className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
          </div>
          {/* Department filter — visible only for SUPER_ADMIN / ADMIN */}
          {showDeptFilter && (
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(0); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="">All Departments</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2">
            <option value="">All Semesters</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Upload size={14} /> Import</button>
          <button className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"><Download size={14} /> Export</button>
        </div>

        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Roll No.</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Semester</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No students found.</td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-500">{page * 10 + i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{s.rollNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <span className="font-medium text-gray-800">{s.firstName} {s.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.departmentName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.semesterName || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.email}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewStudent(s)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="View"><Eye size={14} /></button>
                        {canEditStudent   && <button onClick={() => openEdit(s)} className="p-1 text-green-500 hover:bg-green-50 rounded" title="Edit"><Pencil size={14} /></button>}
                        {canDeleteStudent && <button onClick={() => setDeleteId(s.id)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Showing {page * 10 + 1}–{Math.min((page + 1) * 10, pagination.totalElements || list.length)} of {pagination.totalElements || list.length} students
          </p>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">←</button>
            {Array.from({ length: Math.min(pagination.totalPages || 1, 5) }, (_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`w-8 h-8 text-sm rounded-lg ${page === i ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{i + 1}</button>
            ))}
            <button disabled={page >= (pagination.totalPages || 1) - 1} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingStudent ? "Edit Student" : "Add New Student"} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="John" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="Doe" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="john@college.edu" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">{editingStudent ? "New Password (leave blank)" : "Password *"}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required={!editingStudent} minLength={6} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="••••••" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Roll Number *</label>
              <input name="rollNumber" value={form.rollNumber} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="22A01" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="9876543210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Department *</label>
              <select name="departmentId" value={form.departmentId} onChange={handleChange} required className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
                <option value="">Select Department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Semester * {semLoading && <span className="text-blue-400">(loading…)</span>}
              </label>
              <select
                name="semesterId"
                value={form.semesterId}
                onChange={handleChange}
                required
                disabled={!form.departmentId || semLoading}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!form.departmentId ? "Select Department first" : semLoading ? "Loading semesters…" : filteredSemesters.length === 0 ? "No semesters found" : "Select Semester"}
                </option>
                {filteredSemesters.map((s) => (
                  <option key={s.id} value={s.id}>Semester {s.number} — {s.name}</option>
                ))}
              </select>
              {form.departmentId && !semLoading && filteredSemesters.length === 0 && (
                <p className="text-xs text-orange-500 mt-1">⚠ No semesters found for this department. Go to Semesters page to create them.</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Date of Birth</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Guardian Name</label>
              <input name="guardianName" value={form.guardianName} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="Parent Name" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Guardian Phone</label>
              <input name="guardianPhone" value={form.guardianPhone} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="9876543210" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Address</label>
              <input name="address" value={form.address} onChange={handleChange} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" placeholder="City, State" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : editingStudent ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewStudent} onClose={() => setViewStudent(null)} title="Student Details" size="md">
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700">
                {viewStudent.firstName?.[0]}{viewStudent.lastName?.[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewStudent.firstName} {viewStudent.lastName}</h3>
                <p className="text-sm text-gray-500">{viewStudent.rollNumber}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${viewStudent.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                  {viewStudent.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Email", value: viewStudent.email },
                { label: "Phone", value: viewStudent.phone || "—" },
                { label: "Department", value: viewStudent.departmentName || "—" },
                { label: "Semester", value: viewStudent.semesterName || "—" },
                { label: "Date of Birth", value: viewStudent.dateOfBirth || "—" },
                { label: "Address", value: viewStudent.address || "—" },
                { label: "Guardian Name", value: viewStudent.guardianName || "—" },
                { label: "Guardian Phone", value: viewStudent.guardianPhone || "—" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 font-medium">{item.label}</div>
                  <div className="text-gray-800 mt-0.5 font-medium truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Student"
        message="This will permanently delete the student and all their data. This action cannot be undone."
      />
    </div>
  );
}
