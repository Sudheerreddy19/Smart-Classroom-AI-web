import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, Download, Filter, ArrowLeft, TrendingUp, Users, CheckCircle, XCircle, Calendar } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

export default function AttendanceReport() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [semesters,   setSemesters]   = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [report,      setReport]      = useState([]);
  const [loading,     setLoading]     = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const monthAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString().split("T")[0];

  const [filters, setFilters] = useState({
    departmentId: "", semesterId: "", subjectId: "",
    from: monthAgo, to: today,
  });
  const [activeTab, setActiveTab] = useState("students");
  const [search, setSearch] = useState("");

  useEffect(() => {
    axiosClient.get("/departments").then(r => setDepartments(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    axiosClient.get("/subjects").then(r => setSubjects(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    loadData();
  }, []);

  useEffect(() => {
    if (filters.departmentId) {
      axiosClient.get(`/semesters/department/${filters.departmentId}`)
        .then(r => setSemesters(Array.isArray(r.data) ? r.data : r.data.content ?? []));
    } else {
      setSemesters([]);
      setFilters(f => ({...f, semesterId: ""}));
    }
  }, [filters.departmentId]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.departmentId) params.set("departmentId", filters.departmentId);
    if (filters.semesterId)   params.set("semesterId",   filters.semesterId);
    if (filters.subjectId)    params.set("subjectId",    filters.subjectId);
    params.set("from", filters.from);
    params.set("to",   filters.to);

    try {
      const [rReport, rSessions] = await Promise.all([
        axiosClient.get(`/attendance/report?${params}`),
        axiosClient.get(`/attendance/sessions?${params}`),
      ]);
      setReport(Array.isArray(rReport.data) ? rReport.data : []);
      setSessions(Array.isArray(rSessions.data) ? rSessions.data : []);
    } catch {
      toast.error("Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = report.filter(r =>
    `${r.studentName} ${r.rollNumber}`.toLowerCase().includes(search.toLowerCase())
  );

  const avgPct = report.length > 0
    ? (report.reduce((s, r) => s + r.percentage, 0) / report.length).toFixed(1) : 0;
  const below75 = report.filter(r => r.percentage < 75).length;

  const downloadCSV = () => {
    const header = "Roll Number,Student Name,Department,Semester,Total Classes,Present,Absent,Percentage";
    const rows = filtered.map(r =>
      `${r.rollNumber},${r.studentName},${r.department},${r.semester},${r.totalClasses},${r.presentClasses},${r.absentClasses},${r.percentage}%`
    );
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `attendance-report-${today}.csv`; a.click();
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate("/attendance")} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ background: "#f5f3ff", borderRadius: 12, padding: 10 }}>
            <BarChart2 size={24} color="#7c3aed" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Attendance Report</h1>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>{filters.from} to {filters.to}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={loadData} style={{ background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Refresh
          </button>
          <button onClick={downloadCSV} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
            <Download size={14} /> Export CSV
          </button>
          <button onClick={() => navigate("/attendance/take")} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            + Take Attendance
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,.07)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Department</label>
            <select value={filters.departmentId} onChange={e => setFilters(f => ({...f, departmentId: e.target.value, semesterId: ""}))}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, minWidth: 150 }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Semester</label>
            <select value={filters.semesterId} onChange={e => setFilters(f => ({...f, semesterId: e.target.value}))}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, minWidth: 130 }} disabled={!filters.departmentId}>
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s.id} value={s.id}>Sem {s.number}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>Subject</label>
            <select value={filters.subjectId} onChange={e => setFilters(f => ({...f, subjectId: e.target.value}))}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13, minWidth: 160 }}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>From</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({...f, from: e.target.value}))}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#374151", display: "block", marginBottom: 4 }}>To</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({...f, to: e.target.value}))}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
          </div>
          <button onClick={loadData}
            style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
            <Filter size={14} /> Apply
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Students", val: report.length, color: "#6366f1", icon: Users },
          { label: "Avg Attendance", val: avgPct + "%", color: "#16a34a", icon: TrendingUp },
          { label: "Below 75%",     val: below75,        color: "#dc2626", icon: XCircle },
          { label: "Sessions",      val: sessions.length, color: "#f59e0b", icon: Calendar },
        ].map(({ label, val, color, icon: Icon }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 1px 6px rgba(0,0,0,.07)", border: "1px solid #e5e7eb", borderLeft: `4px solid ${color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 800, color }}>{val}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{label}</div>
              </div>
              <Icon size={22} color={color} style={{ opacity: 0.5 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[["students", "Student Report"], ["sessions", "Session Log"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
              background: activeTab === key ? "#2563eb" : "#f3f4f6", color: activeTab === key ? "#fff" : "#6b7280" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Student Table */}
      {activeTab === "students" && (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,.07)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", gap: 12, alignItems: "center" }}>
            <input placeholder="Search student or roll number…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 13 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>{filtered.length} students</span>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>
              No data for selected filters.<br />Take attendance first.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Roll No.", "Student Name", "Department", "Semester", "Total", "Present", "Absent", "Percentage", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const pct = r.percentage;
                  const pctColor = pct >= 75 ? "#16a34a" : pct >= 60 ? "#f59e0b" : "#dc2626";
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.rollNumber}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, color: "#111827", fontWeight: 600 }}>{r.studentName}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{r.department}</td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6b7280" }}>{r.semester}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center" }}>{r.totalClasses}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#16a34a", fontWeight: 600 }}>{r.presentClasses}</td>
                      <td style={{ padding: "10px 16px", fontSize: 13, textAlign: "center", color: "#dc2626" }}>{r.absentClasses}</td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: pctColor, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: pctColor, minWidth: 38 }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                          background: pct >= 75 ? "#dcfce7" : pct >= 60 ? "#fef9c3" : "#fee2e2",
                          color:      pct >= 75 ? "#16a34a" : pct >= 60 ? "#b45309" : "#dc2626" }}>
                          {pct >= 75 ? "Good" : pct >= 60 ? "Low" : "Shortage"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Sessions Table */}
      {activeTab === "sessions" && (
        <div style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,.07)", border: "1px solid #e5e7eb", overflow: "hidden" }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", fontSize: 13 }}>No sessions found in this date range.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Date", "Subject", "Teacher", "Room", "Present", "Total", "Status"].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151" }}>{s.sessionDate}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "#111827" }}>{s.subjectName}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "#374151" }}>{s.teacherName}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "#6b7280" }}>{s.roomNumber}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{s.presentCount}</td>
                    <td style={{ padding: "10px 16px", fontSize: 13 }}>{s.totalStudents}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                        background: s.status === "ACTIVE" ? "#dcfce7" : s.status === "COMPLETED" ? "#eff6ff" : "#fee2e2",
                        color: s.status === "ACTIVE" ? "#16a34a" : s.status === "COMPLETED" ? "#2563eb" : "#dc2626" }}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
