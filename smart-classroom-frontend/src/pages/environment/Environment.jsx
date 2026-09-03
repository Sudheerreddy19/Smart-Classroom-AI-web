import { useEffect, useState, useCallback } from "react";
import { Download, Thermometer, Droplets, Leaf, Volume2, Users, Wind, Eye, AlertTriangle, RefreshCw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import environmentApi from "../../api/environmentApi";
import { useSelector } from "react-redux";
import { selectClassrooms } from "../../store/slices/classroomSlice";
import { useDispatch } from "react-redux";
import { fetchClassrooms } from "../../store/slices/classroomSlice";
import { PageLoader } from "../../components/common/Spinner";

export default function Environment() {
  const dispatch = useDispatch();
  const { list: classrooms } = useSelector(selectClassrooms);

  const [allData, setAllData]     = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [hours, setHours]         = useState(24);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => { dispatch(fetchClassrooms()); }, [dispatch]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await environmentApi.getAll();
      setAllData(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch { setAllData([]); }
    finally { setLoading(false); }
  }, []);

  const loadHistory = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const { data } = await environmentApi.getHistory(selectedRoom, hours);
      setHistory(Array.isArray(data) ? data : []);
    } catch { setHistory([]); }
  }, [selectedRoom, hours]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => {
    if (classrooms.length && !selectedRoom) setSelectedRoom(String(classrooms[0]?.id || ""));
  }, [classrooms, selectedRoom]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  /* Current reading for selected room */
  const current = allData.find((d) => String(d.classroomId) === selectedRoom) || allData[0] || {};

  const metricCards = [
    { label:"Temperature", value: current.temperature != null ? `${current.temperature} °C` : "—", sub: "Comfortable", subColor:"text-green-600", icon: Thermometer, bg:"bg-orange-50", ic:"text-orange-500" },
    { label:"Humidity",    value: current.humidity    != null ? `${current.humidity} %`    : "—", sub: "Normal",      subColor:"text-green-600", icon: Droplets,    bg:"bg-blue-50",   ic:"text-blue-500"   },
    { label:"Air Quality", value: current.airQualityIndex != null ? `${current.airQualityIndex} AQI` : "—", sub: "Good", subColor:"text-green-600", icon: Leaf, bg:"bg-green-50", ic:"text-green-500" },
    { label:"Light",       value: current.lightLevel  != null ? `${current.lightLevel} lux`: "—", sub: "Optimal",    subColor:"text-green-600", icon: Wind,        bg:"bg-yellow-50", ic:"text-yellow-500" },
    { label:"Noise",       value: current.noiseLevel  != null ? `${current.noiseLevel} dB` : "—", sub: "Moderate",   subColor:"text-orange-600",icon: Volume2,     bg:"bg-red-50",    ic:"text-red-500"    },
    { label:"CO₂ Level",   value: current.co2Level    != null ? `${current.co2Level} ppm`  : "—", sub: "Normal",     subColor:"text-green-600", icon: Users,       bg:"bg-purple-50", ic:"text-purple-500" },
  ];

  /* Chart data from history */
  const chartData = history.map((h) => ({
    time: h.recordedAt ? new Date(h.recordedAt).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "",
    temp:     h.temperature,
    humidity: h.humidity,
    aqi:      h.airQualityIndex,
    noise:    h.noiseLevel,
    light:    h.lightLevel,
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Environment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time environmental monitoring of classrooms.</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && <span className="text-xs text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={loadAll} className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /></button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className={`w-9 h-9 ${m.bg} rounded-lg flex items-center justify-center mb-2`}><Icon size={18} className={m.ic} /></div>
              <div className="text-lg font-bold text-gray-900">{m.value}</div>
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className={`text-xs font-medium mt-0.5 ${m.subColor}`}>{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Trend Chart + Current Status */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="font-semibold text-gray-800 text-sm">Environmental Trends</h2>
            <div className="flex gap-2">
              <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400">
                <option value="">All Rooms</option>
                {classrooms.map((c) => <option key={c.id} value={c.id}>{c.roomNumber}</option>)}
              </select>
              <select value={hours} onChange={(e) => { setHours(Number(e.target.value)); }} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400">
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours</option>
                <option value={48}>48 Hours</option>
              </select>
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              {selectedRoom ? "No history data available. Connect ESP32 sensors to start recording." : "Select a classroom to view trends."}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="temp"     stroke="#3b82f6" strokeWidth={1.5} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="Humidity (%)" />
                <Line type="monotone" dataKey="aqi"      stroke="#10b981" strokeWidth={1.5} dot={false} name="AQI" />
                <Line type="monotone" dataKey="noise"    stroke="#ef4444" strokeWidth={1.5} dot={false} name="Noise (dB)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Current Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Current Status</h3>
          {loading ? <PageLoader /> : (
            <div className="space-y-3">
              {[
                { label:"Temperature",  value: current.temperature != null ? `${current.temperature} °C` : "—", ok: true },
                { label:"Humidity",     value: current.humidity    != null ? `${current.humidity} %`     : "—", ok: true },
                { label:"Air Quality",  value: current.airQualityIndex != null ? `${current.airQualityIndex} AQI` : "—", ok: true },
                { label:"Light",        value: current.lightLevel  != null ? `${current.lightLevel} lux` : "—", ok: true },
                { label:"Noise Level",  value: current.noiseLevel  != null ? `${current.noiseLevel} dB`  : "—", ok: current.noiseLevel < 60 },
                { label:"CO₂",          value: current.co2Level    != null ? `${current.co2Level} ppm`   : "—", ok: current.co2Level < 800 },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs">{s.label}</span>
                  <span className="text-xs font-medium flex items-center gap-1.5">
                    {s.value}
                    <span className={`w-2 h-2 rounded-full ${s.ok ? "bg-green-400" : "bg-orange-400"}`}></span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {current.recordedAt && (
            <p className="text-xs text-gray-400 mt-4 border-t border-gray-100 pt-3">
              Last reading: {new Date(current.recordedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Classroom Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 text-sm">Environment by Classroom</h2>
          <span className="text-xs text-gray-400">{allData.length} sensor location{allData.length !== 1 ? "s" : ""}</span>
        </div>
        {allData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            <Leaf size={32} className="mx-auto mb-2 opacity-30" />
            No sensor data available. Make sure ESP32 sensors are connected and sending data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  {["Classroom","Temp (°C)","Humidity (%)","AQI","Light (lux)","Noise (dB)","CO₂ (ppm)","Recorded","Action"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allData.map((d, i) => {
                  const room = classrooms.find((c) => c.id === d.classroomId);
                  return (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-800">{room?.roomNumber || `Room ${d.classroomId}`}</td>
                      <td className="px-4 py-3 text-gray-600">{d.temperature ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.humidity ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.airQualityIndex ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.lightLevel ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.noiseLevel ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.co2Level ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                        {d.recordedAt ? new Date(d.recordedAt).toLocaleTimeString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedRoom(String(d.classroomId))} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Eye size={13} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-400 px-4 py-3 border-t border-gray-100">
          ℹ Data from ESP32 sensors via MQTT. Updates every 30 seconds.
        </p>
      </div>
    </div>
  );
}
