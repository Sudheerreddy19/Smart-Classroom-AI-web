import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Upload, FileSpreadsheet, Download, CheckCircle2,
  XCircle, AlertTriangle, Users, RefreshCw, Eye, UserPlus, ArrowRight
} from "lucide-react";
import axiosClient from "../../api/axiosClient";

export default function StudentImport() {
  const navigate = useNavigate();
  const [file, setFile]           = useState(null);
  const [dragging, setDragging]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState(null);
  const fileRef = useRef();

  // ── File handlers ─────────────────────────────────────────────
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".xlsx")) {
      setFile(f);
      setResult(null);
    } else {
      toast.error("Please upload a .xlsx Excel file.");
    }
  }, []);

  const onFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); }
  };

  // ── Import ────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) { toast.error("Please select an Excel file first."); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await axiosClient.post("/students/import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(data);
      if (data.imported > 0) toast.success(`${data.imported} students imported successfully!`);
      else toast.error("No students were imported. Check the errors below.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Template download ─────────────────────────────────────────
  const handleTemplate = async () => {
    try {
      const res = await axiosClient.get("/students/template", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = "student_import_template.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download template.");
    }
  };

  const reset = () => { setFile(null); setResult(null); fileRef.current.value = ""; };

  return (
    <div className="si-page">

      {/* ── Choose Method Banner ── */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
        marginBottom: 24, padding: "0 0 4px"
      }}>
        {/* Manual entry card */}
        <div
          onClick={() => navigate("/students")}
          style={{
            background: "linear-gradient(135deg, #eff6ff, #dbeafe)",
            border: "2px solid #3b82f6", borderRadius: 14,
            padding: "20px 22px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 16,
            transition: "transform .15s",
          }}
          onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
        >
          <div style={{ width: 48, height: 48, background: "#3b82f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <UserPlus size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e40af" }}>Add Students Manually</div>
            <div style={{ fontSize: 13, color: "#3b82f6", marginTop: 3 }}>
              Add one student at a time using a form
            </div>
            <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
              Go to Students page → click Add Student <ArrowRight size={12} />
            </div>
          </div>
        </div>

        {/* Excel import card */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
          border: "2px solid #22c55e", borderRadius: 14,
          padding: "20px 22px",
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ width: 48, height: 48, background: "#22c55e", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <FileSpreadsheet size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#166534" }}>Bulk Import via Excel</div>
            <div style={{ fontSize: 13, color: "#16a34a", marginTop: 3 }}>
              Upload .xlsx to add many students at once
            </div>
            <div style={{ fontSize: 12, color: "#4ade80", marginTop: 6 }}>
              ← You are on this page
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="si-header">
        <div className="si-header-icon"><FileSpreadsheet size={28} /></div>
        <div>
          <h1 className="si-title">Import Students</h1>
          <p className="si-sub">Upload an Excel (.xlsx) file to batch-import student academic records.</p>
        </div>
        <button className="si-template-btn" onClick={handleTemplate}>
          <Download size={16} /> Download Template
        </button>
      </div>

      {/* Info Banner */}
      <div className="si-info">
        <AlertTriangle size={16} />
        <div>
          <strong>Important:</strong> Imported students will have status <code>NOT_REGISTERED</code>.
          Each student must then self-register at <em>/student-register</em> using their Roll Number and Date of Birth.
        </div>
      </div>

      {/* Expected Columns */}
      <div className="si-columns-card">
        <h3 className="si-section-title">📋 Required Excel Columns (A → K)</h3>
        <div className="si-columns-grid">
          {[
            ["A", "Roll Number"],
            ["B", "Admission Number"],
            ["C", "First Name"],
            ["D", "Last Name"],
            ["E", "Department"],
            ["F", "Branch"],
            ["G", "Year"],
            ["H", "Semester (1-8)"],
            ["I", "Section"],
            ["J", "Date of Birth (dd-MM-yyyy)"],
            ["K", "Official Email"],
          ].map(([col, name]) => (
            <div key={col} className="si-col-item">
              <span className="si-col-letter">{col}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={`si-drop ${dragging ? "si-drop--active" : ""} ${file ? "si-drop--has-file" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && fileRef.current.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx"
          onChange={onFileSelect}
          style={{ display: "none" }}
        />
        {file ? (
          <div className="si-file-info">
            <FileSpreadsheet size={40} className="si-file-icon" />
            <div>
              <div className="si-file-name">{file.name}</div>
              <div className="si-file-size">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        ) : (
          <div className="si-drop-content">
            <Upload size={40} className="si-drop-icon" />
            <p className="si-drop-text">Drag & drop your <strong>.xlsx</strong> file here</p>
            <p className="si-drop-sub">or click to browse</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {file && (
        <div className="si-actions">
          <button className="si-reset-btn" onClick={reset}>
            <RefreshCw size={16} /> Reset
          </button>
          <button className="si-import-btn" onClick={handleImport} disabled={uploading}>
            {uploading
              ? <><RefreshCw size={16} className="si-spin" /> Importing…</>
              : <><Upload size={16} /> Import Students</>}
          </button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="si-result">
          <h3 className="si-section-title">Import Results</h3>

          {/* Summary Cards */}
          <div className="si-result-cards">
            <div className="si-rcard si-rcard--total">
              <Users size={20} />
              <div>
                <div className="si-rcard-num">{result.totalRows}</div>
                <div className="si-rcard-label">Total Rows</div>
              </div>
            </div>
            <div className="si-rcard si-rcard--success">
              <CheckCircle2 size={20} />
              <div>
                <div className="si-rcard-num">{result.imported}</div>
                <div className="si-rcard-label">Imported</div>
              </div>
            </div>
            <div className="si-rcard si-rcard--skip">
              <Eye size={20} />
              <div>
                <div className="si-rcard-num">{result.skipped}</div>
                <div className="si-rcard-label">Skipped</div>
              </div>
            </div>
            <div className="si-rcard si-rcard--fail">
              <XCircle size={20} />
              <div>
                <div className="si-rcard-num">{result.failed}</div>
                <div className="si-rcard-label">Failed</div>
              </div>
            </div>
          </div>

          {/* Errors List */}
          {result.errors?.length > 0 && (
            <div className="si-errors">
              <h4 className="si-errors-title"><XCircle size={16} /> Errors / Warnings</h4>
              <ul className="si-error-list">
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style>{`
        .si-page {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Inter', sans-serif;
        }

        .si-header {
          display: flex; align-items: center; gap: 1rem;
        }
        .si-header-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }
        .si-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0; }
        .si-sub   { color: #64748b; margin: 4px 0 0; font-size: 0.9rem; }
        .si-template-btn {
          margin-left: auto; display: flex; align-items: center; gap: 8px;
          padding: 10px 18px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: white; color: #475569; cursor: pointer; font-weight: 600;
          font-family: inherit; font-size: 0.85rem; transition: all 0.15s;
          white-space: nowrap;
        }
        .si-template-btn:hover { background: #f8fafc; border-color: #6366f1; color: #6366f1; }

        .si-info {
          display: flex; align-items: flex-start; gap: 10px;
          background: #fefce8; border: 1px solid #fde047;
          border-radius: 12px; padding: 1rem 1.25rem;
          font-size: 0.85rem; color: #92400e;
        }
        .si-info svg { flex-shrink: 0; margin-top: 2px; }
        .si-info code { background: rgba(0,0,0,0.08); padding: 2px 6px; border-radius: 4px; }

        .si-columns-card {
          background: white; border: 1px solid #e2e8f0;
          border-radius: 16px; padding: 1.5rem;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .si-section-title {
          font-size: 1rem; font-weight: 600; color: #1e293b;
          margin: 0 0 1rem;
        }
        .si-columns-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
        }
        .si-col-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; background: #f8fafc;
          border-radius: 8px; font-size: 0.83rem; color: #475569;
        }
        .si-col-letter {
          width: 26px; height: 26px; border-radius: 6px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-weight: 700; font-size: 0.75rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .si-drop {
          border: 2.5px dashed #cbd5e1; border-radius: 16px;
          padding: 3rem; text-align: center; cursor: pointer;
          background: #f8fafc; transition: all 0.2s;
        }
        .si-drop--active { border-color: #6366f1; background: #eff6ff; }
        .si-drop--has-file { border-color: #22c55e; background: #f0fdf4; cursor: default; }
        .si-drop-icon { color: #94a3b8; margin: 0 auto 1rem; }
        .si-drop-text { font-size: 1rem; color: #475569; margin: 0 0 6px; }
        .si-drop-sub  { font-size: 0.83rem; color: #94a3b8; margin: 0; }
        .si-file-info { display: flex; align-items: center; gap: 1rem; justify-content: center; }
        .si-file-icon { color: #22c55e; }
        .si-file-name { font-weight: 600; color: #1e293b; }
        .si-file-size { font-size: 0.8rem; color: #64748b; }

        .si-actions { display: flex; justify-content: flex-end; gap: 0.75rem; }
        .si-reset-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 11px 20px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: white; color: #64748b; cursor: pointer;
          font-family: inherit; font-weight: 600; font-size: 0.9rem; transition: all 0.15s;
        }
        .si-reset-btn:hover { background: #f8fafc; }
        .si-import-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 24px; border-radius: 10px; border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white; cursor: pointer;
          font-family: inherit; font-weight: 700; font-size: 0.95rem; transition: all 0.2s;
        }
        .si-import-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(34,197,94,0.4); }
        .si-import-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .si-spin { animation: spin 1s linear infinite; }

        .si-result { display: flex; flex-direction: column; gap: 1rem; }
        .si-result-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
        .si-rcard {
          display: flex; align-items: center; gap: 12px;
          padding: 1.25rem; border-radius: 12px;
        }
        .si-rcard--total   { background: #f1f5f9; color: #475569; }
        .si-rcard--success { background: #f0fdf4; color: #16a34a; }
        .si-rcard--skip    { background: #eff6ff; color: #2563eb; }
        .si-rcard--fail    { background: #fef2f2; color: #dc2626; }
        .si-rcard-num   { font-size: 1.75rem; font-weight: 800; }
        .si-rcard-label { font-size: 0.78rem; font-weight: 500; opacity: 0.8; }

        .si-errors {
          background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 12px; padding: 1.25rem;
        }
        .si-errors-title {
          display: flex; align-items: center; gap: 6px;
          color: #dc2626; font-weight: 600; font-size: 0.9rem; margin: 0 0 10px;
        }
        .si-error-list {
          margin: 0; padding: 0 0 0 1.25rem;
          display: flex; flex-direction: column; gap: 4px;
          font-size: 0.83rem; color: #991b1b;
        }

        @media (max-width: 640px) {
          .si-result-cards { grid-template-columns: repeat(2, 1fr); }
          .si-template-btn { display: none; }
        }
      `}</style>
    </div>
  );
}
