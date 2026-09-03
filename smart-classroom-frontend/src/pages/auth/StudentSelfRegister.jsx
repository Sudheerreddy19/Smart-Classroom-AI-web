import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import {
  GraduationCap, User, Lock, Phone, Mail, Calendar,
  CheckCircle2, ArrowRight, Eye, EyeOff, BookOpen
} from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "/api";

// Step labels
const STEPS = ["Verify Identity", "Create Account", "Success"];

export default function StudentSelfRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: verify, 1: account, 2: done

  // Step 0 state
  const [rollNumber, setRollNumber]   = useState("");
  const [dob, setDob]                 = useState("");
  const [verifying, setVerifying]     = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);

  // Step 1 state
  const [form, setForm]     = useState({ mobile: "", personalEmail: "", password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Step 0: Verify Roll + DOB ──────────────────────────────────
  const handleVerify = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !dob) {
      toast.error("Please enter Roll Number and Date of Birth.");
      return;
    }
    setVerifying(true);
    try {
      const { data } = await axios.post(`${BASE}/auth/student-verify`, {
        rollNumber: rollNumber.trim(),
        dateOfBirth: dob
      });
      setStudentInfo(data);
      setStep(1);
      toast.success("Identity verified! Create your account now.");
    } catch (err) {
      const msg = err.response?.data?.message || "Verification failed. Check your Roll Number and Date of Birth.";
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  // ── Step 1: Create Account ─────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.mobile.match(/^[0-9]{10}$/)) e.mobile = "Enter a valid 10-digit mobile number";
    if (!form.personalEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.personalEmail = "Enter a valid email";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await axios.post(`${BASE}/auth/student-register`, {
        rollNumber: rollNumber.trim(),
        dateOfBirth: dob,
        mobile: form.mobile,
        personalEmail: form.personalEmail,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      setStep(2);
      toast.success("Account created successfully! You can now log in.");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const fi = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => ({ ...er, [field]: undefined }));
  };

  return (
    <div className="sreg-root">
      {/* Background */}
      <div className="sreg-bg" />

      <div className="sreg-card">
        {/* Logo */}
        <div className="sreg-logo">
          <GraduationCap size={36} />
        </div>
        <h1 className="sreg-title">Student Registration</h1>
        <p className="sreg-sub">Smart Classroom ERP — Create your account</p>

        {/* Stepper */}
        <div className="sreg-stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`sreg-step ${i === step ? "sreg-step--active" : i < step ? "sreg-step--done" : ""}`}>
              <div className="sreg-step-dot">
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className="sreg-step-label">{s}</span>
            </div>
          ))}
        </div>

        {/* ── Step 0: Verify ── */}
        {step === 0 && (
          <form className="sreg-form" onSubmit={handleVerify}>
            <p className="sreg-help">
              Enter the <strong>Roll Number</strong> and <strong>Date of Birth</strong> provided
              by your college administration.
            </p>

            <div className="sreg-field">
              <label>Roll Number *</label>
              <div className="sreg-input-wrap">
                <BookOpen size={16} className="sreg-icon" />
                <input
                  type="text"
                  placeholder="e.g. 22CS001"
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="sreg-field">
              <label>Date of Birth *</label>
              <div className="sreg-input-wrap">
                <Calendar size={16} className="sreg-icon" />
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                />
              </div>
            </div>

            <button className="sreg-btn" type="submit" disabled={verifying}>
              {verifying ? "Verifying…" : <><span>Verify Identity</span><ArrowRight size={18} /></>}
            </button>

            <p className="sreg-login-link">
              Already have an account? <Link to="/">Login here</Link>
            </p>
          </form>
        )}

        {/* ── Step 1: Create Account ── */}
        {step === 1 && studentInfo && (
          <form className="sreg-form" onSubmit={handleRegister}>
            {/* Student info preview */}
            <div className="sreg-preview">
              <div className="sreg-preview-row"><span>Name</span><strong>{studentInfo.firstName} {studentInfo.lastName}</strong></div>
              <div className="sreg-preview-row"><span>Roll No</span><strong>{studentInfo.rollNumber}</strong></div>
              <div className="sreg-preview-row"><span>Department</span><strong>{studentInfo.departmentName}</strong></div>
              <div className="sreg-preview-row"><span>Semester</span><strong>{studentInfo.semesterName}</strong></div>
            </div>

            <p className="sreg-help">These academic details are set by your college and <strong>cannot be changed</strong>.</p>

            <div className="sreg-field">
              <label>Mobile Number *</label>
              <div className={`sreg-input-wrap ${errors.mobile ? "sreg-input-wrap--err" : ""}`}>
                <Phone size={16} className="sreg-icon" />
                <input type="tel" placeholder="10-digit mobile" value={form.mobile} onChange={fi("mobile")} maxLength={10} />
              </div>
              {errors.mobile && <span className="sreg-err">{errors.mobile}</span>}
            </div>

            <div className="sreg-field">
              <label>Personal Email *</label>
              <div className={`sreg-input-wrap ${errors.personalEmail ? "sreg-input-wrap--err" : ""}`}>
                <Mail size={16} className="sreg-icon" />
                <input type="email" placeholder="your@email.com" value={form.personalEmail} onChange={fi("personalEmail")} />
              </div>
              {errors.personalEmail && <span className="sreg-err">{errors.personalEmail}</span>}
            </div>

            <div className="sreg-field">
              <label>Password *</label>
              <div className={`sreg-input-wrap ${errors.password ? "sreg-input-wrap--err" : ""}`}>
                <Lock size={16} className="sreg-icon" />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={fi("password")}
                />
                <button type="button" className="sreg-eye" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="sreg-err">{errors.password}</span>}
            </div>

            <div className="sreg-field">
              <label>Confirm Password *</label>
              <div className={`sreg-input-wrap ${errors.confirmPassword ? "sreg-input-wrap--err" : ""}`}>
                <Lock size={16} className="sreg-icon" />
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={fi("confirmPassword")}
                />
              </div>
              {errors.confirmPassword && <span className="sreg-err">{errors.confirmPassword}</span>}
            </div>

            <div className="sreg-btn-row">
              <button type="button" className="sreg-btn-back" onClick={() => setStep(0)}>Back</button>
              <button className="sreg-btn" type="submit" disabled={submitting}>
                {submitting ? "Creating Account…" : <><span>Create Account</span><ArrowRight size={18} /></>}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 2: Success ── */}
        {step === 2 && (
          <div className="sreg-success">
            <div className="sreg-success-icon"><CheckCircle2 size={56} /></div>
            <h2>Account Created!</h2>
            <p>Your student account has been created successfully.<br />You can now log in with your personal email and password.</p>
            <p className="sreg-note">⚠️ Your teacher will register your face for attendance. Please visit your department after logging in.</p>
            <button className="sreg-btn" onClick={() => navigate("/")}>Go to Login</button>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .sreg-root {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', sans-serif;
          padding: 2rem 1rem;
          position: relative;
          background: #0f172a;
        }
        .sreg-bg {
          position: fixed; inset: 0; z-index: 0;
          background: radial-gradient(ellipse at 30% 30%, rgba(99,102,241,0.25) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.2) 0%, transparent 60%);
        }
        .sreg-card {
          position: relative; z-index: 1;
          background: rgba(30,41,59,0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 2.5rem 2rem;
          width: 100%; max-width: 480px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.5);
        }
        .sreg-logo {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          color: white; margin: 0 auto 1.25rem;
        }
        .sreg-title { text-align: center; font-size: 1.6rem; font-weight: 800; color: #f8fafc; margin: 0; }
        .sreg-sub   { text-align: center; color: #94a3b8; font-size: 0.85rem; margin: 6px 0 1.5rem; }

        /* Stepper */
        .sreg-stepper { display: flex; justify-content: center; gap: 1.5rem; margin-bottom: 1.75rem; }
        .sreg-step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .sreg-step-dot {
          width: 32px; height: 32px; border-radius: 50%;
          background: #1e293b; border: 2px solid #334155;
          color: #64748b; font-weight: 700; font-size: 0.8rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .sreg-step--active .sreg-step-dot { background: #6366f1; border-color: #6366f1; color: white; }
        .sreg-step--done  .sreg-step-dot  { background: #22c55e; border-color: #22c55e; color: white; }
        .sreg-step-label { font-size: 0.72rem; color: #64748b; font-weight: 500; white-space: nowrap; }
        .sreg-step--active .sreg-step-label { color: #a5b4fc; }
        .sreg-step--done  .sreg-step-label  { color: #86efac; }

        /* Form */
        .sreg-form { display: flex; flex-direction: column; gap: 1rem; }
        .sreg-help { font-size: 0.83rem; color: #94a3b8; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 10px; padding: 10px 14px; margin: 0; }
        .sreg-field { display: flex; flex-direction: column; gap: 6px; }
        .sreg-field label { font-size: 0.78rem; font-weight: 600; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.04em; }
        .sreg-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: #0f172a; border: 1.5px solid #334155;
          border-radius: 12px; padding: 11px 14px;
          transition: border-color 0.2s;
        }
        .sreg-input-wrap:focus-within { border-color: #6366f1; }
        .sreg-input-wrap--err { border-color: #f87171; }
        .sreg-icon { color: #64748b; flex-shrink: 0; }
        .sreg-input-wrap input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #f1f5f9; font-size: 0.9rem; font-family: inherit;
        }
        .sreg-input-wrap input::placeholder { color: #475569; }
        .sreg-eye { background: none; border: none; cursor: pointer; color: #64748b; padding: 0; }
        .sreg-err { color: #f87171; font-size: 0.75rem; }

        /* Preview box */
        .sreg-preview {
          background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
          border-radius: 12px; padding: 12px 16px; display: flex; flex-direction: column; gap: 6px;
        }
        .sreg-preview-row {
          display: flex; justify-content: space-between; font-size: 0.85rem;
        }
        .sreg-preview-row span { color: #94a3b8; }
        .sreg-preview-row strong { color: #e2e8f0; }

        /* Buttons */
        .sreg-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px; border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
          font-weight: 700; font-size: 0.95rem; font-family: inherit;
          transition: all 0.2s; margin-top: 4px;
        }
        .sreg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,0.4); }
        .sreg-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .sreg-btn-row { display: flex; gap: 0.75rem; }
        .sreg-btn-back {
          flex: 1; padding: 13px; border-radius: 12px; border: 1.5px solid #334155;
          background: transparent; color: #94a3b8; cursor: pointer; font-family: inherit;
          font-weight: 600; transition: all 0.15s;
        }
        .sreg-btn-back:hover { background: #1e293b; color: #e2e8f0; }
        .sreg-btn-row .sreg-btn { flex: 2; }
        .sreg-login-link { text-align: center; font-size: 0.83rem; color: #64748b; margin: 0; }
        .sreg-login-link a { color: #818cf8; text-decoration: none; font-weight: 600; }

        /* Success */
        .sreg-success { text-align: center; display: flex; flex-direction: column; gap: 1rem; align-items: center; }
        .sreg-success-icon { color: #22c55e; }
        .sreg-success h2 { font-size: 1.4rem; font-weight: 800; color: #f1f5f9; margin: 0; }
        .sreg-success p  { color: #94a3b8; margin: 0; font-size: 0.9rem; line-height: 1.6; }
        .sreg-note { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); border-radius: 10px; padding: 10px 14px; color: #fcd34d !important; font-size: 0.82rem !important; }
      `}</style>
    </div>
  );
}
