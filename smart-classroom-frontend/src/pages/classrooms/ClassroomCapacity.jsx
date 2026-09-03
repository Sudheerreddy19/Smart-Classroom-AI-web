import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { RefreshCw, Building2, Users, TrendingUp, AlertCircle, CheckCircle2, Zap } from "lucide-react";
import axiosClient from "../../api/axiosClient";

export default function ClassroomCapacity() {
  const navigate = useNavigate();
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const r = await axiosClient.get("/classrooms/capacity-report");
      setReport(Array.isArray(r.data) ? r.data : []);
    } catch { toast.error("Failed to load report."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const adjustCapacity = async (deptCode) => {
    setAdjusting(a => ({ ...a, [deptCode]: true }));
    try {
      const r = await axiosClient.post(`/classrooms/adjust-capacity?deptCode=${deptCode}`);
      toast.success(r.data);
      load();
    } catch (err) { toast.error(err.response?.data || "Failed to adjust."); }
    finally { setAdjusting(a => ({ ...a, [deptCode]: false })); }
  };

  // Group by dept prefix (e.g. "CSE" from "CSE-A")
  const grouped = report.reduce((acc, entry) => {
    const dept = entry.roomNumber.split("-")[0];
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(entry);
    return acc;
  }, {});

  const totalStudents = report.reduce((s, e) => s + e.used, 0);
  const totalCapacity = report.reduce((s, e) => s + e.capacity, 0);
  const totalRooms    = report.length;
  const avgFill       = totalRooms > 0 ? (totalStudents / totalRooms).toFixed(1) : 0;

  const fillColor = (pct) => {
    if (pct >= 90) return "#dc2626";
    if (pct >= 70) return "#f59e0b";
    return "#16a34a";
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ background: "#eff6ff", borderRadius: 12, padding: 10 }}><Building2 size={24} color="#2563eb" /></div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Classroom Capacity</h1>
            <p style={{ color: "#6b7280", fontSize: 13, margin: 0 }}>Auto-assigned classrooms · CSE-A, ECE-B style naming</p>
          </div>
        </div>
        <button onClick={load} style={{ background: "#f3f4f6", border: "none", borderRadius: 9, padding: "9px 14px", cursor: "pointer", display: "flex", gap: 6, alignItems: "center", fontWeight: 600, fontSize: 13 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Students", value: totalStudents, icon: <Users size={18} color="#2563eb" />, bg: "#eff6ff", color: "#1d4ed8" },
          { label: "Total Classrooms", value: totalRooms, icon: <Building2 size={18} color="#7c3aed" />, bg: "#f5f3ff", color: "#6d28d9" },
          { label: "Total Capacity", value: totalCapacity, icon: <TrendingUp size={18} color="#16a34a" />, bg: "#f0fdf4", color: "#15803d" },
          { label: "Avg per Classroom", value: avgFill, icon: <Zap size={18} color="#f59e0b" />, bg: "#fffbeb", color: "#b45309" },
        ].map(card => (
          <div key={card.label} style={{ background: card.bg, borderRadius: 14, padding: 18, border: `1px solid ${card.color}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#6b7280" }}>Loading report…</div>
      ) : report.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <Building2 size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p style={{ fontSize: 14 }}>No auto-assigned classrooms yet.</p>
          <p style={{ fontSize: 12 }}>Classrooms like CSE-A, ECE-A are created automatically when students are registered.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([dept, rooms]) => {
          const deptTotal = rooms.reduce((s, r) => s + r.used, 0);
          const deptCap   = rooms.reduce((s, r) => s + r.capacity, 0);
          const deptAvg   = rooms.length > 0 ? Math.ceil(deptTotal / rooms.length) : 0;

          return (
            <div key={dept} style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", marginBottom: 20, overflow: "hidden" }}>
              {/* Dept header */}
              <div style={{ background: "#f8fafc", padding: "16px 22px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: "#2563eb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>
                    {dept}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{dept} Department</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {rooms.length} classroom{rooms.length !== 1 ? "s" : ""} · {deptTotal} students · avg {deptAvg} per room
                    </div>
                  </div>
                </div>
                <button onClick={() => adjustCapacity(dept)} disabled={adjusting[dept]}
                  style={{ background: adjusting[dept] ? "#e5e7eb" : "#2563eb", color: adjusting[dept] ? "#6b7280" : "#fff", border: "none", borderRadius: 9, padding: "8px 16px", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", gap: 6, alignItems: "center" }}>
                  <Zap size={13} /> {adjusting[dept] ? "Adjusting…" : "Auto-Adjust Capacity"}
                </button>
              </div>

              {/* Rooms */}
              <div style={{ padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
                {rooms.map(room => {
                  const pct = room.fillPercent;
                  const color = fillColor(pct);
                  const isFull = room.free <= 0;
                  return (
                    <div key={room.id} style={{ borderRadius: 12, border: `1px solid ${color}30`, padding: 16, background: `${color}08`, position: "relative" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 18, color: "#111827" }}>{room.roomNumber}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>Capacity: {room.capacity}</div>
                        </div>
                        {isFull
                          ? <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>FULL</span>
                          : <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>{room.free} free</span>
                        }
                      </div>
                      {/* Progress bar */}
                      <div style={{ background: "#e5e7eb", borderRadius: 99, height: 7, marginBottom: 8 }}>
                        <div style={{ background: color, borderRadius: 99, height: 7, width: `${Math.min(pct, 100)}%`, transition: "width 0.4s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color }}>
                          {room.used} / {room.capacity} students
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dept summary bar */}
              <div style={{ padding: "10px 22px", background: "#f8fafc", borderTop: "1px solid #e5e7eb", display: "flex", gap: 24, fontSize: 12, color: "#6b7280" }}>
                <span>Total: <strong>{deptTotal}</strong> students</span>
                <span>Capacity: <strong>{deptCap}</strong></span>
                <span>Utilization: <strong style={{ color: fillColor((deptTotal/deptCap)*100) }}>{((deptTotal/deptCap)*100).toFixed(1)}%</strong></span>
                <span>Avg per room: <strong>{deptAvg}</strong></span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}