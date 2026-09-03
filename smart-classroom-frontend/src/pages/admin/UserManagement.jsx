import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus, Pencil, Trash2, Loader2, RefreshCw, Shield,
  Eye, EyeOff, ToggleLeft, ToggleRight, Key, Building2
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { PageLoader } from "../../components/common/Spinner";
import { usePermissions } from "../../hooks/usePermissions";
import AccessDenied from "../../components/common/AccessDenied";
import { fetchDepartments, selectDepartments } from "../../store/slices/departmentSlice";
import toast from "react-hot-toast";

const ROLE_COLORS = {
  SUPER_ADMIN: "bg-red-100 text-red-700",
  ADMIN:       "bg-blue-100 text-blue-700",
  HOD:         "bg-purple-100 text-purple-700",
  TEACHER:     "bg-green-100 text-green-700",
  STUDENT:     "bg-orange-100 text-orange-700",
};

// Roles each caller can create — matches backend validateCreationPermission
const CREATABLE_ROLES = {
  SUPER_ADMIN: ["ADMIN", "HOD", "TEACHER", "STUDENT"],
  ADMIN:       ["HOD", "TEACHER", "STUDENT"],
  HOD:         ["TEACHER", "STUDENT"],
  TEACHER:     ["STUDENT"],
};

// Roles that require a department selection
const ROLES_NEEDING_DEPT = ["HOD", "TEACHER", "STUDENT"];

const EMPTY_FORM = { firstName: "", lastName: "", email: "", password: "", phone: "", role: "TEACHER", departmentId: "" };
const EMPTY_PW   = { newPassword: "", confirmPassword: "" };

export default function UserManagement() {
  const dispatch = useDispatch();
  const { role, canManageUsers, isSuperAdmin, isAdmin } = usePermissions();
  const { list: depts, loading: deptLoading } = useSelector(selectDepartments);

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [page,       setPage]       = useState(0);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDept, setSelectedDept] = useState(""); // "" = all departments
  const [selectedRole, setSelectedRole] = useState(""); // "" = all visible roles

  const showDeptFilter = isSuperAdmin || isAdmin;

  // Mirrors RoleValidator.canManage() on the backend:
  // returns true if the logged-in role can manage (toggle/reset/delete) a user with targetRole.
  const canManageUser = (targetRole) => {
    switch (role) {
      case "SUPER_ADMIN": return targetRole !== "SUPER_ADMIN";
      case "ADMIN":       return ["HOD", "TEACHER", "STUDENT"].includes(targetRole);
      case "HOD":         return ["TEACHER", "STUDENT"].includes(targetRole);
      case "TEACHER":     return targetRole === "STUDENT";
      default:            return false;
    }
  };


  // Create modal
  const [createModal, setCreateModal] = useState(false);
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Reset password modal
  const [pwModal,  setPwModal]  = useState(false);
  const [pwUserId, setPwUserId] = useState(null);
  const [pwForm,   setPwForm]   = useState(EMPTY_PW);
  const [savingPw, setSavingPw] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View detail
  const [viewUser, setViewUser] = useState(null);

  useEffect(() => { dispatch(fetchDepartments()); }, [dispatch]);
  useEffect(() => { loadUsers(); }, [page, selectedDept, selectedRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      let url = `/admin/users?page=${page}&size=10&sort=id,desc`;
      if (selectedDept) url += `&departmentId=${selectedDept}`;
      if (selectedRole) url += `&role=${selectedRole}`;
      const { data } = await axiosClient.get(url);
      if (data.content) {
        setUsers(data.content); setTotal(data.totalElements); setTotalPages(data.totalPages);
      } else {
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  if (!canManageUsers) return <AccessDenied message="Only administrators and HODs can manage users." />;

  const creatableRoles = CREATABLE_ROLES[role] || [];
  const needsDept = ROLES_NEEDING_DEPT.includes(form.role);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: value,
      // Reset departmentId when switching to a role that doesn't need it
      ...(name === "role" && !ROLES_NEEDING_DEPT.includes(value) ? { departmentId: "" } : {}),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (needsDept && !form.departmentId) { toast.error("Please select a department."); return; }

    setSaving(true);
    try {
      const payload = {
        firstName:    form.firstName,
        lastName:     form.lastName,
        email:        form.email,
        password:     form.password,
        phone:        form.phone,
        role:         form.role,
        departmentId: needsDept && form.departmentId ? Number(form.departmentId) : null,
      };
      await axiosClient.post("/admin/users", payload);
      toast.success("User created successfully!");
      setCreateModal(false);
      setForm({ ...EMPTY_FORM, role: creatableRoles[0] || "TEACHER" });
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      await axiosClient.put(`/admin/users/${id}/toggle-status`);
      loadUsers();
      toast.success("User status updated.");
    } catch { toast.error("Failed to toggle status."); }
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setSavingPw(true);
    try {
      await axiosClient.put(`/admin/users/${pwUserId}/reset-password`, { newPassword: pwForm.newPassword });
      toast.success("Password reset successfully!");
      setPwModal(false); setPwForm(EMPTY_PW);
    } catch { toast.error("Failed to reset password."); }
    finally { setSavingPw(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await axiosClient.delete(`/admin/users/${deleteId}`);
      toast.success("User deleted.");
      setDeleteId(null); loadUsers();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete user."); }
    finally { setDeleting(false); }
  };

  const openCreate = () => {
    const defaultRole = creatableRoles[0] || "TEACHER";
    setForm({ ...EMPTY_FORM, role: defaultRole });
    setCreateModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={22} className="text-blue-600" /> User Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Create and manage user accounts with department assignment.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadUsers} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
            <RefreshCw size={16} />
          </button>
          {creatableRoles.length > 0 && (
            <button onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
              <Plus size={16} /> Add User
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800 flex items-start gap-3">
        <Shield size={18} className="flex-shrink-0 mt-0.5 text-blue-600" />
        <div>
          <strong>Security Policy:</strong> Public registration is restricted to <strong>Students only</strong>.
          Teachers, HODs, and Admins must be created here by an authorized administrator.
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Users",  v: total,                                                             color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Admins",       v: users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN").length, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "HODs",         v: users.filter(u => u.role === "HOD").length,                        color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Teachers",     v: users.filter(u => u.role === "TEACHER").length,                    color: "text-green-600",  bg: "bg-green-50" },
          { label: "Students",     v: users.filter(u => u.role === "STUDENT").length,                    color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.v}</div>
            <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table with dept filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Dept filter bar */}
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium text-gray-600">Filter:</span>
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

          {/* Role filter — shows roles visible to the logged-in user */}
          <select
            value={selectedRole}
            onChange={(e) => { setSelectedRole(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="">All Roles</option>
            {creatableRoles.map((r) => (
              <option key={r} value={r}>{r.replace("_", " ")}</option>
            ))}
          </select>

          {!showDeptFilter && (
            <span className="text-sm text-gray-400 italic">
              Showing your department only
            </span>
          )}
        </div>
        {loading ? <PageLoader /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 text-xs uppercase bg-gray-50 border-b border-gray-100">
                {["#", "Name", "Email", "Role", "Phone", "Status", "Email Verified", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400">No users found.</td></tr>
                ) : users.map((u, i) => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-400">{page * 10 + i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <span className="font-medium text-gray-800">{u.firstName} {u.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(u.id)} title="Toggle status">
                        {u.enabled
                          ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><ToggleRight size={16} /> Active</span>
                          : <span className="flex items-center gap-1 text-gray-400 text-xs"><ToggleLeft size={16} /> Disabled</span>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.emailVerified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {u.emailVerified ? "Verified" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* View — always shown */}
                        <button onClick={() => setViewUser(u)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="View">
                          <Eye size={14} />
                        </button>
                        {/* Reset password — only if caller can manage this role */}
                        {canManageUser(u.role) && (
                          <button
                            onClick={() => { setPwUserId(u.id); setPwForm(EMPTY_PW); setPwModal(true); }}
                            className="p-1 text-orange-500 hover:bg-orange-50 rounded"
                            title="Reset Password"
                          >
                            <Key size={14} />
                          </button>
                        )}
                        {/* Delete — only if caller can manage this role */}
                        {canManageUser(u.role) && (
                          <button
                            onClick={() => setDeleteId(u.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
          <span className="text-sm text-gray-500">
            Showing {page * 10 + 1}–{Math.min((page + 1) * 10, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">←</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i).map(i => (
              <button key={i} onClick={() => setPage(i)}
                className={`w-8 h-8 text-sm rounded-lg ${page === i ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {i + 1}
              </button>
            ))}
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">→</button>
          </div>
        </div>
      </div>

      {/* ── Create User Modal ── */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create User Account" size="md">
        <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            ⚠️ HOD, Teacher, and Student accounts require a department selection.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required autoComplete="off"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required autoComplete="off"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="off"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Role *</label>
            <select name="role" value={form.role} onChange={handleChange} required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400">
              {creatableRoles.map(r => (
                <option key={r} value={r}>{r.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Department — shown only for roles that need it */}
          {needsDept && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                <Building2 size={12} /> Department *
              </label>
              {deptLoading ? (
                <div className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-400 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin" /> Loading...
                </div>
              ) : depts.length === 0 ? (
                <div className="w-full text-sm border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 text-amber-700">
                  No departments found. Create a department first.
                </div>
              ) : (
                <select name="departmentId" value={form.departmentId} onChange={handleChange}
                  required={needsDept}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 bg-white">
                  <option value="">— Select Department —</option>
                  {depts.map(d => (
                    <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input name="phone" value={form.phone} onChange={handleChange} autoComplete="off"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password *</label>
              <div className="relative">
                <input name="password" type={showPw ? "text" : "password"} value={form.password}
                  onChange={handleChange} required minLength={6} autoComplete="new-password"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 pr-10 py-2 focus:outline-none focus:border-blue-400" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-2.5 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal isOpen={pwModal} onClose={() => setPwModal(false)} title="Reset Password" size="sm">
        <form onSubmit={handleResetPw} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">New Password *</label>
            <input type="password" value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              required minLength={6}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Confirm Password *</label>
            <input type="password" value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required minLength={6}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPwModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={savingPw}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-60">
              {savingPw && <Loader2 size={14} className="animate-spin" />}
              {savingPw ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── View User Modal ── */}
      <Modal isOpen={!!viewUser} onClose={() => setViewUser(null)} title="User Details">
        {viewUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${ROLE_COLORS[viewUser.role] || "bg-gray-100 text-gray-600"}`}>
                {viewUser.firstName?.[0]}{viewUser.lastName?.[0]}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-lg">{viewUser.firstName} {viewUser.lastName}</div>
                <div className="text-sm text-gray-500">{viewUser.email}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ROLE_COLORS[viewUser.role]}`}>{viewUser.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l: "Phone",          v: viewUser.phone || "—" },
                { l: "Status",         v: viewUser.enabled ? "Active" : "Disabled" },
                { l: "Email Verified", v: viewUser.emailVerified ? "Yes" : "No" },
                { l: "User ID",        v: `#${viewUser.id}` },
              ].map(item => (
                <div key={item.l} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 font-medium">{item.l}</div>
                  <div className="font-medium text-gray-800 mt-0.5">{item.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete User"
        message="Permanently delete this user account and all their data?" />
    </div>
  );
}
