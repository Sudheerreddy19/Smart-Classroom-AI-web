import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GraduationCap, Eye, EyeOff, Loader2,
  CheckCircle2, User, Mail, Phone, Lock,
  ChevronRight, AlertCircle, Info, Building2
} from "lucide-react";
import { registerUser, clearError, selectAuth } from "../../store/slices/authSlice";
import { fetchDepartmentsPublic, selectDepartments } from "../../store/slices/departmentSlice";
import toast from "react-hot-toast";

/* Students ONLY — staff accounts are created by admins */
const STEPS = ["Details", "Password"];

export default function Register() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error } = useSelector(selectAuth);
  const { list: departments, loading: deptLoading } = useSelector(selectDepartments);

  const [step,       setStep]       = useState(0);
  const [showPw,     setShowPw]     = useState(false);
  const [showCPw,    setShowCPw]    = useState(false);
  const [localError, setLocalError] = useState("");

  const [form, setForm] = useState({
    firstName: "", lastName: "",
    email: "", phone: "",
    departmentId: "",
    password: "", confirmPassword: "",
  });

  // Clear stale auth errors when page mounts and load departments
  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchDepartmentsPublic());
  }, [dispatch]);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    setLocalError("");
    if (step === 0) {
      if (!form.firstName.trim())  { setLocalError("First name is required.");   return false; }
      if (!form.lastName.trim())   { setLocalError("Last name is required.");    return false; }
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
                                   { setLocalError("Valid email is required.");  return false; }
      if (!form.departmentId)      { setLocalError("Please select your department."); return false; }
    }
    if (step === 1) {
      if (form.password.length < 6)                    { setLocalError("Password must be at least 6 characters."); return false; }
      if (form.password !== form.confirmPassword)       { setLocalError("Passwords do not match.");               return false; }
    }
    return true;
  };

  const handleNext  = () => { if (validate()) setStep(s => s + 1); };
  const handleBack  = () => { setLocalError(""); dispatch(clearError()); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await dispatch(registerUser({
      firstName:    form.firstName.trim(),
      lastName:     form.lastName.trim(),
      email:        form.email.trim().toLowerCase(),
      password:     form.password,
      role:         "STUDENT",                       // always STUDENT
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    }));
    if (registerUser.fulfilled.match(result)) {
      toast.success("Account created! Redirecting to dashboard...");
      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
    }
  };

  const displayError = localError || error;

  const strengthLevel = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strengthLevel];
  const strengthColor = ["", "bg-red-400", "bg-yellow-400", "bg-green-400"][strengthLevel];

  // Find selected department name for summary card
  const selectedDept = departments.find(d => String(d.id) === String(form.departmentId));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">Smart Classroom Hub</div>
              <div className="text-blue-200 text-xs">Student Registration</div>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    i < step  ? "bg-white border-white text-blue-600"
                    : i===step ? "bg-blue-500 border-white text-white shadow-lg"
                    :            "bg-transparent border-blue-300 text-blue-300"
                  }`}>
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:inline ${i <= step ? "text-white" : "text-blue-300"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-white" : "bg-blue-400"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6">

          {/* Info notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mb-5">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>
              This registration is for <strong>students only</strong>.
              If you are a teacher or admin, contact your administrator to create your account.
            </span>
          </div>

          {/* Error */}
          {displayError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </div>
          )}

          {/* ── Step 0: Personal Details ── */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Your details</h2>
              <p className="text-sm text-gray-500 mb-5">Enter your personal information to create your student account.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">First Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-gray-400" />
                      <input name="firstName" value={form.firstName} onChange={handleChange} autoFocus
                        placeholder="John" autoComplete="off"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1.5 block">Last Name *</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-gray-400" />
                      <input name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="Doe" autoComplete="off"
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Email Address *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      placeholder="john.doe@college.edu" autoComplete="off"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                      placeholder="9876543210" autoComplete="off"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                  </div>
                </div>

                {/* Department dropdown */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                    {deptLoading ? (
                      <div className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-400 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin" /> Loading departments...
                      </div>
                    ) : departments.length === 0 ? (
                      <div className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-200 bg-amber-50 rounded-lg text-amber-700">
                        No departments available. Contact your administrator.
                      </div>
                    ) : (
                      <select
                        name="departmentId"
                        value={form.departmentId}
                        onChange={handleChange}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition appearance-none bg-white"
                      >
                        <option value="">— Select your department —</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Password ── */}
          {step === 1 && (
            <form onSubmit={handleSubmit} noValidate>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Set your password</h2>
              <p className="text-sm text-gray-500 mb-4">Choose a strong password to keep your account safe.</p>

              {/* Summary */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-5">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-700">
                    {form.firstName[0]}{form.lastName[0]}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{form.firstName} {form.lastName}</div>
                  <div className="text-xs text-gray-400 truncate">{form.email} · Student</div>
                  {selectedDept && (
                    <div className="text-xs text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                      <Building2 size={11} /> {selectedDept.code} — {selectedDept.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* Password */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Password *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input name="password" type={showPw ? "text" : "password"} value={form.password} onChange={handleChange}
                      placeholder="Min. 6 characters" autoComplete="new-password"
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1,2,3].map(i => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strengthLevel ? strengthColor : "bg-gray-200"}`} />
                      ))}
                      <span className="text-xs text-gray-400 ml-1">{strengthLabel}</span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Confirm Password *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                    <input name="confirmPassword" type={showCPw ? "text" : "password"} value={form.confirmPassword} onChange={handleChange}
                      placeholder="Re-enter your password" autoComplete="new-password"
                      className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 transition ${
                        form.confirmPassword
                          ? form.password === form.confirmPassword
                            ? "border-green-400 focus:border-green-400 focus:ring-green-100"
                            : "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                      }`} />
                    <button type="button" onClick={() => setShowCPw(!showCPw)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    {form.confirmPassword && form.password === form.confirmPassword && (
                      <CheckCircle2 size={14} className="absolute right-10 top-3 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                By registering you agree to our{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">Terms of Service</span> and{" "}
                <span className="text-blue-600 cursor-pointer hover:underline">Privacy Policy</span>.
              </p>

              <button type="submit" disabled={loading}
                className="mt-5 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm shadow-lg shadow-blue-200">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : "Create Student Account"}
              </button>
            </form>
          )}

          {/* Navigation (step 0) */}
          {step === 0 && (
            <button type="button" onClick={handleNext}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-sm">
              Continue <ChevronRight size={16} />
            </button>
          )}

          {step === 1 && (
            <button type="button" onClick={handleBack}
              className="mt-3 w-full py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-xl transition">
              ← Back to details
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/" className="text-blue-600 font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
