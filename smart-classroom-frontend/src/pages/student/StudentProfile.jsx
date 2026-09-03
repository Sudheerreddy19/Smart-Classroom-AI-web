import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { User, Mail, Phone, Lock, Save, Loader2, Eye, EyeOff, Camera } from "lucide-react";
import { selectUser, selectAuth } from "../../store/slices/authSlice";
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

export default function StudentProfile() {
  const dispatch = useDispatch();
  const user     = useSelector(selectUser);
  const { loading } = useSelector(selectAuth);

  const [editMode, setEditMode]   = useState(false);
  const [showPw,   setShowPw]     = useState(false);
  const [showCPw,  setShowCPw]    = useState(false);
  const [saving,   setSaving]     = useState(false);
  const [savingPw, setSavingPw]   = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName:  user?.lastName  || "",
    phone:     user?.phone     || "",
  });

  const [pwForm, setPwForm] = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });

  const handleProfileChange = (e) => setProfileForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handlePwChange      = (e) => setPwForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a real system: PATCH /api/users/me
      await axiosClient.put(`/api/admin/users/${user?.userId}/reset-password`, {});
      toast.success("Profile updated! (demo â€” backend update endpoint needed)");
      setEditMode(false);
    } catch {
      toast.error("Failed to update profile.");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error("Passwords do not match."); return; }
    if (pwForm.newPassword.length < 6) { toast.error("Min. 6 characters."); return; }
    setSavingPw(true);
    try {
      await axiosClient.post("/auth/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword:     pwForm.newPassword,
      });
      toast.success("Password changed successfully!");
      setPwForm({ currentPassword:"", newPassword:"", confirmPassword:"" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally { setSavingPw(false); }
  };

  const roleLabel = user?.role?.replace("_"," ") || "User";
  const initials  = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and update your personal information.</p>
      </div>

      {/* â”€â”€ Avatar Card â”€â”€ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {initials}
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:bg-gray-50">
              <Camera size={13} className="text-gray-600" />
            </button>
          </div>
          <div>
            <div className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-gray-500">{user?.email}</div>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{roleLabel}</span>
          </div>
          <button onClick={() => setEditMode(!editMode)} className="ml-auto text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg">
            {editMode ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* â”€â”€ Personal Details â”€â”€ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Personal Information</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">First Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-gray-400" />
                <input name="firstName" value={profileForm.firstName} onChange={handleProfileChange}
                  disabled={!editMode}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none transition ${editMode ? "border-gray-200 focus:border-blue-400 bg-white" : "border-gray-100 bg-gray-50 text-gray-500"}`} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Last Name</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-3 text-gray-400" />
                <input name="lastName" value={profileForm.lastName} onChange={handleProfileChange}
                  disabled={!editMode}
                  className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none transition ${editMode ? "border-gray-200 focus:border-blue-400 bg-white" : "border-gray-100 bg-gray-50 text-gray-500"}`} />
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
              <input value={user?.email || ""} disabled
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-100 bg-gray-50 text-gray-500 rounded-lg" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin if needed.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Phone Number</label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
              <input name="phone" value={profileForm.phone} onChange={handleProfileChange}
                disabled={!editMode}
                className={`w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none transition ${editMode ? "border-gray-200 focus:border-blue-400 bg-white" : "border-gray-100 bg-gray-50 text-gray-500"}`} />
            </div>
          </div>

          {editMode && (
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* â”€â”€ Change Password â”€â”€ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1.5 block">Current Password *</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
              <input name="currentPassword" type="password" value={pwForm.currentPassword} onChange={handlePwChange} required
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">New Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                <input name="newPassword" type={showPw?"text":"password"} value={pwForm.newPassword} onChange={handlePwChange} required minLength={6}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirm New Password *</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                <input name="confirmPassword" type={showCPw?"text":"password"} value={pwForm.confirmPassword} onChange={handlePwChange} required minLength={6}
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none ${pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"}`} />
                <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3 top-3 text-gray-400">
                  {showCPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPw}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-60">
              {savingPw ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

