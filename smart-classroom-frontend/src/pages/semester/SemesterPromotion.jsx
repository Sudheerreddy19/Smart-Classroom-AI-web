import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  TrendingUp, GraduationCap, Users, ChevronRight,
  RotateCcw, CheckCircle2, Award, AlertTriangle, BookOpen
} from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { selectUser } from "../../store/slices/authSlice";

// ─────────────────────────────────────────────────────────────────
//  SemesterPromotion page
//  Accessible by: SUPER_ADMIN, ADMIN, HOD
//  HODs see only their own department.
// ─────────────────────────────────────────────────────────────────

export default function SemesterPromotion() {
  const currentUser = useSelector(selectUser);
  const role = currentUser?.role;

  const [departments, setDepartments]   = useState([]);
  const [semesters, setSemesters]       = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSem,  setSelectedSem]  = useState("");
  const [studentCount, setStudentCount] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [promoting, setPromoting]       = useState(false);
  const [lastResult, setLastResult]     = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);

  // ── Load departments ──────────────────────────────────────────
  useEffect(() => {
    axiosClient.get("/departments").then(({ data }) => {
      const list = Array.isArray(data) ? data : data.content ?? [];
      setDepartments(list);
      // HOD: pre-select their department
      if (role === "HOD" && list.length > 0) {
        // Try to find their dept from the teacher profile
        axiosClient.get("/teachers/my").then(({ data: t }) => {
          if (t?.departmentId) setSelectedDept(String(t.departmentId));
        }).catch(() => {});
      }
    }).catch(() => toast.error("Failed to load departments."));
  }, [role]);

  // ── Load semesters when dept changes ─────────────────────────
  useEffect(() => {
    if (!selectedDept) { setSemesters([]); setSelectedSem(""); return; }
    axiosClient.get(`/semesters?departmentId=${selectedDept}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        // Sort by number
        list.sort((a, b) => a.number - b.number);
        setSemesters(list);
        setSelectedSem("");
      })
      .catch(() => toast.error("Failed to load semesters."));
  }, [selectedDept]);

  // ── Count students when dept+sem changes ─────────────────────
  useEffect(() => {
    if (!selectedDept || !selectedSem) { setStudentCount(null); return; }
    axiosClient.get(`/students/department/${selectedDept}/semester/${selectedSem}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.content ?? [];
        setStudentCount(list.filter(s => s.active).length);
      })
      .catch(() => setStudentCount(null));
  }, [selectedDept, selectedSem]);

  // ── Selected semester info ────────────────────────────────────
  const currentSemObj = semesters.find(s => String(s.id) === selectedSem);
  const isFinalSem    = currentSemObj?.number === 8;
  const nextSemNum    = currentSemObj ? currentSemObj.number + 1 : null;

  // ── Bulk promote handler ──────────────────────────────────────
  const handlePromote = async () => {
    setConfirmOpen(false);
    setPromoting(true);
    setLastResult(null);
    try {
      const { data } = await axiosClient.put(
        `/students/promote-batch?departmentId=${selectedDept}&semesterId=${selectedSem}`
      );
      setLastResult(data);
      if (data.promoted > 0 || data.graduated > 0) {
        toast.success(data.message || "Promotion complete!");
      } else {
        toast.error(data.message || "No students promoted.");
      }
      // Re-count students
      setStudentCount(0);
    } catch (err) {
      toast.error(err.response?.data?.message || "Promotion failed.");
    } finally {
      setPromoting(false);
    }
  };

  const canPromote = selectedDept && selectedSem && studentCount > 0;

  return (
    <div className="sem-promo-page">
      {/* ── Page Header ── */}
      <div className="sem-promo-header">
        <div className="sem-promo-header-icon">
          <TrendingUp size={28} />
        </div>
        <div>
          <h1 className="sem-promo-title">Semester Promotion</h1>
          <p className="sem-promo-sub">
            Promote students to the next semester after exam completion.
            Students in Semester 8 will be marked as <strong>Graduated</strong>.
          </p>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className="sem-promo-cards">
        <div className="sem-promo-card sem-promo-card--blue">
          <BookOpen size={20} />
          <div>
            <div className="sem-promo-card-label">8 Semesters</div>
            <div className="sem-promo-card-desc">4 years × 2 per year</div>
          </div>
        </div>
        <div className="sem-promo-card sem-promo-card--green">
          <TrendingUp size={20} />
          <div>
            <div className="sem-promo-card-label">Sem 1 → 8</div>
            <div className="sem-promo-card-desc">Sequential progression</div>
          </div>
        </div>
        <div className="sem-promo-card sem-promo-card--gold">
          <GraduationCap size={20} />
          <div>
            <div className="sem-promo-card-label">Sem 8 Complete</div>
            <div className="sem-promo-card-desc">Student graduates</div>
          </div>
        </div>
      </div>

      {/* ── Promotion Form ── */}
      <div className="sem-promo-form-card">
        <h2 className="sem-promo-section-title">
          <Users size={18} /> Select Batch to Promote
        </h2>

        <div className="sem-promo-selects">
          {/* Department */}
          <div className="sem-promo-select-group">
            <label className="sem-promo-label">Department</label>
            <select
              className="sem-promo-select"
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              disabled={role === "HOD"}
            >
              <option value="">-- Select Department --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Current Semester */}
          <div className="sem-promo-select-group">
            <label className="sem-promo-label">Current Semester</label>
            <select
              className="sem-promo-select"
              value={selectedSem}
              onChange={e => setSelectedSem(e.target.value)}
              disabled={!selectedDept}
            >
              <option value="">-- Select Semester --</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  Semester {s.number} — {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Preview Panel ── */}
        {selectedSem && currentSemObj && (
          <div className="sem-promo-preview">
            <div className="sem-promo-arrow-row">
              <div className="sem-promo-sem-box sem-promo-sem-box--from">
                <span className="sem-promo-sem-num">Sem {currentSemObj.number}</span>
                <span className="sem-promo-sem-name">{currentSemObj.name}</span>
              </div>
              <ChevronRight size={32} className="sem-promo-arrow" />
              <div className={`sem-promo-sem-box ${isFinalSem ? "sem-promo-sem-box--grad" : "sem-promo-sem-box--to"}`}>
                {isFinalSem ? (
                  <>
                    <GraduationCap size={24} />
                    <span className="sem-promo-sem-name">Graduated</span>
                  </>
                ) : (
                  <>
                    <span className="sem-promo-sem-num">Sem {nextSemNum}</span>
                    <span className="sem-promo-sem-name">Next Semester</span>
                  </>
                )}
              </div>
            </div>

            {isFinalSem && (
              <div className="sem-promo-warning">
                <AlertTriangle size={16} />
                Students in Semester 8 will be <strong>marked as Graduated</strong> and
                their accounts will be deactivated.
              </div>
            )}

            <div className="sem-promo-count-row">
              <Users size={16} />
              {studentCount === null
                ? <span>Loading student count…</span>
                : studentCount === 0
                  ? <span className="sem-promo-no-students">No active students in this semester</span>
                  : <span><strong>{studentCount}</strong> active student{studentCount > 1 ? "s" : ""} will be promoted</span>
              }
            </div>
          </div>
        )}

        {/* ── Promote Button ── */}
        <div className="sem-promo-actions">
          <button
            className={`sem-promo-btn ${isFinalSem ? "sem-promo-btn--grad" : "sem-promo-btn--promote"}`}
            disabled={!canPromote || promoting}
            onClick={() => setConfirmOpen(true)}
          >
            {promoting ? (
              <RotateCcw size={18} className="sem-promo-spin" />
            ) : isFinalSem ? (
              <GraduationCap size={18} />
            ) : (
              <TrendingUp size={18} />
            )}
            {promoting
              ? "Processing…"
              : isFinalSem
                ? `Graduate ${studentCount ?? ""} Student${studentCount !== 1 ? "s" : ""}`
                : `Promote to Semester ${nextSemNum}`}
          </button>
        </div>
      </div>

      {/* ── Last Result Banner ── */}
      {lastResult && (
        <div className="sem-promo-result">
          <CheckCircle2 size={20} className="sem-promo-result-icon" />
          <div>
            <div className="sem-promo-result-title">Promotion Complete</div>
            <div className="sem-promo-result-stats">
              {lastResult.promoted > 0 && (
                <span className="sem-promo-stat sem-promo-stat--blue">
                  <TrendingUp size={14} /> {lastResult.promoted} Promoted
                </span>
              )}
              {lastResult.graduated > 0 && (
                <span className="sem-promo-stat sem-promo-stat--gold">
                  <Award size={14} /> {lastResult.graduated} Graduated
                </span>
              )}
              <span className="sem-promo-stat sem-promo-stat--gray">
                <Users size={14} /> {lastResult.total} Total
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      {confirmOpen && (
        <div className="sem-promo-overlay">
          <div className="sem-promo-dialog">
            <div className={`sem-promo-dialog-icon ${isFinalSem ? "sem-promo-dialog-icon--grad" : "sem-promo-dialog-icon--promote"}`}>
              {isFinalSem ? <GraduationCap size={28} /> : <TrendingUp size={28} />}
            </div>
            <h3 className="sem-promo-dialog-title">
              {isFinalSem ? "Confirm Graduation" : "Confirm Promotion"}
            </h3>
            <p className="sem-promo-dialog-msg">
              {isFinalSem
                ? `Graduate ${studentCount} student${studentCount !== 1 ? "s" : ""} from ${currentSemObj?.name}? Their accounts will be deactivated.`
                : `Promote ${studentCount} student${studentCount !== 1 ? "s" : ""} from Semester ${currentSemObj?.number} to Semester ${nextSemNum}?`}
            </p>
            <div className="sem-promo-dialog-btns">
              <button className="sem-promo-dialog-cancel" onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button
                className={`sem-promo-dialog-confirm ${isFinalSem ? "sem-promo-dialog-confirm--grad" : ""}`}
                onClick={handlePromote}
              >
                {isFinalSem ? "Yes, Graduate" : "Yes, Promote"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Semester Timeline (visual) ── */}
      <div className="sem-promo-timeline-card">
        <h2 className="sem-promo-section-title">
          <BookOpen size={18} /> Academic Journey (8 Semesters)
        </h2>
        <div className="sem-promo-timeline">
          {[1,2,3,4,5,6,7,8].map((num, i) => {
            const isActive = currentSemObj?.number === num;
            const isFinal  = num === 8;
            return (
              <div key={num} className="sem-promo-tl-item">
                <div className={`sem-promo-tl-dot ${isActive ? "sem-promo-tl-dot--active" : ""} ${isFinal ? "sem-promo-tl-dot--final" : ""}`}>
                  {isFinal ? <GraduationCap size={14} /> : num}
                </div>
                <div className="sem-promo-tl-label">
                  Sem {num}
                  <span>{["1st","2nd"].includes(num === 1 ? "1st" : num === 2 ? "2nd" : "") ? "" : ""}</span>
                </div>
                {i < 7 && <div className="sem-promo-tl-line" />}
              </div>
            );
          })}
        </div>
        <div className="sem-promo-tl-legend">
          <span className="sem-promo-tl-legend-item"><span className="sem-promo-tl-dot sem-promo-tl-dot--active" style={{width:16,height:16,fontSize:10}}>■</span> Current selection</span>
          <span className="sem-promo-tl-legend-item"><span className="sem-promo-tl-dot sem-promo-tl-dot--final" style={{width:16,height:16}}><GraduationCap size={10}/></span> Final semester</span>
        </div>
      </div>

      <style>{`
        .sem-promo-page {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Inter', sans-serif;
        }

        /* Header */
        .sem-promo-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .sem-promo-header-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        .sem-promo-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
        .sem-promo-sub   { color: #64748b; margin: 4px 0 0; font-size: 0.9rem; }

        /* Cards */
        .sem-promo-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .sem-promo-card {
          display: flex; align-items: center; gap: 12px;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          font-size: 0.875rem;
        }
        .sem-promo-card--blue  { background: #eff6ff; color: #3b82f6; }
        .sem-promo-card--green { background: #f0fdf4; color: #22c55e; }
        .sem-promo-card--gold  { background: #fefce8; color: #ca8a04; }
        .sem-promo-card-label  { font-weight: 700; font-size: 0.95rem; }
        .sem-promo-card-desc   { color: #94a3b8; font-size: 0.78rem; }

        /* Form Card */
        .sem-promo-form-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
        }
        .sem-promo-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 1rem; font-weight: 600; color: #1e293b;
          margin: 0;
        }

        /* Selects */
        .sem-promo-selects {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .sem-promo-select-group { display: flex; flex-direction: column; gap: 6px; }
        .sem-promo-label { font-size: 0.8rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
        .sem-promo-select {
          padding: 10px 12px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #1e293b;
          background: #f8fafc;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .sem-promo-select:focus { border-color: #6366f1; background: white; }
        .sem-promo-select:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Preview */
        .sem-promo-preview {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sem-promo-arrow-row {
          display: flex; align-items: center; justify-content: center; gap: 1.5rem;
        }
        .sem-promo-sem-box {
          display: flex; flex-direction: column; align-items: center; gap: 4px;
          padding: 1rem 1.5rem;
          border-radius: 12px;
          min-width: 120px;
          text-align: center;
        }
        .sem-promo-sem-box--from { background: #ede9fe; color: #7c3aed; }
        .sem-promo-sem-box--to   { background: #d1fae5; color: #059669; }
        .sem-promo-sem-box--grad { background: #fef9c3; color: #b45309; }
        .sem-promo-sem-num  { font-size: 1.3rem; font-weight: 800; }
        .sem-promo-sem-name { font-size: 0.75rem; opacity: 0.7; }
        .sem-promo-arrow { color: #94a3b8; }

        .sem-promo-warning {
          display: flex; align-items: center; gap: 8px;
          background: #fef9c3; border: 1px solid #fde047;
          border-radius: 8px; padding: 10px 14px;
          font-size: 0.85rem; color: #92400e;
        }
        .sem-promo-count-row {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.9rem; color: #475569;
          justify-content: center;
        }
        .sem-promo-no-students { color: #f59e0b; font-style: italic; }

        /* Buttons */
        .sem-promo-actions { display: flex; justify-content: flex-end; }
        .sem-promo-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 24px;
          border-radius: 10px; border: none; cursor: pointer;
          font-size: 0.95rem; font-weight: 600;
          transition: all 0.2s;
        }
        .sem-promo-btn--promote {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
        }
        .sem-promo-btn--promote:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.4); }
        .sem-promo-btn--grad {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
        }
        .sem-promo-btn--grad:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245,158,11,0.4); }
        .sem-promo-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .sem-promo-spin { animation: spin 1s linear infinite; }

        /* Result Banner */
        .sem-promo-result {
          display: flex; align-items: flex-start; gap: 1rem;
          background: #f0fdf4; border: 1.5px solid #86efac;
          border-radius: 12px; padding: 1.25rem 1.5rem;
        }
        .sem-promo-result-icon { color: #22c55e; flex-shrink: 0; margin-top: 2px; }
        .sem-promo-result-title { font-weight: 700; color: #166534; font-size: 1rem; }
        .sem-promo-result-stats { display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
        .sem-promo-stat {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 12px; border-radius: 99px; font-size: 0.82rem; font-weight: 600;
        }
        .sem-promo-stat--blue { background: #dbeafe; color: #1d4ed8; }
        .sem-promo-stat--gold { background: #fef9c3; color: #92400e; }
        .sem-promo-stat--gray { background: #f1f5f9; color: #475569; }

        /* Confirm Dialog */
        .sem-promo-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .sem-promo-dialog {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          max-width: 440px; width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.2);
          animation: dialogIn 0.2s ease;
        }
        @keyframes dialogIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .sem-promo-dialog-icon {
          width: 64px; height: 64px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
        }
        .sem-promo-dialog-icon--promote { background: #ede9fe; color: #7c3aed; }
        .sem-promo-dialog-icon--grad    { background: #fef9c3; color: #b45309; }
        .sem-promo-dialog-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
        .sem-promo-dialog-msg   { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem; line-height: 1.5; }
        .sem-promo-dialog-btns  { display: flex; gap: 0.75rem; justify-content: center; }
        .sem-promo-dialog-cancel {
          padding: 10px 24px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: white; color: #475569; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .sem-promo-dialog-cancel:hover { background: #f8fafc; }
        .sem-promo-dialog-confirm {
          padding: 10px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-weight: 600; cursor: pointer;
          transition: all 0.15s;
        }
        .sem-promo-dialog-confirm:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
        .sem-promo-dialog-confirm--grad { background: linear-gradient(135deg, #f59e0b, #d97706); }

        /* Timeline */
        .sem-promo-timeline-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 1px 6px rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .sem-promo-timeline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow-x: auto;
          padding: 0.5rem 0;
        }
        .sem-promo-tl-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
        }
        .sem-promo-tl-dot {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem; color: #94a3b8;
          position: relative; z-index: 2;
          transition: all 0.2s;
        }
        .sem-promo-tl-dot--active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: #6366f1;
          color: white;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.2);
          transform: scale(1.2);
        }
        .sem-promo-tl-dot--final {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-color: #f59e0b;
          color: white;
        }
        .sem-promo-tl-label {
          margin-top: 8px;
          font-size: 0.72rem;
          color: #94a3b8;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
        }
        .sem-promo-tl-line {
          position: absolute;
          top: 20px;
          left: 50%;
          width: 100%;
          height: 2px;
          background: #e2e8f0;
          z-index: 1;
        }
        .sem-promo-tl-legend {
          display: flex; gap: 1.5rem;
          font-size: 0.78rem; color: #64748b;
        }
        .sem-promo-tl-legend-item {
          display: flex; align-items: center; gap: 6px;
        }

        @media (max-width: 640px) {
          .sem-promo-cards   { grid-template-columns: 1fr; }
          .sem-promo-selects { grid-template-columns: 1fr; }
          .sem-promo-arrow-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
