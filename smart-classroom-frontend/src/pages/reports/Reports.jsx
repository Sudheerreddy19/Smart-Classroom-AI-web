import { Download, Users, BarChart3, BookOpen, Monitor, FileText, Calendar } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

const stats = [
  { label: "Total Students", value: "520", sub: "↑ 4 this week", color: "text-blue-600", bg: "bg-blue-50", icon: Users },
  { label: "Attendance Rate", value: "92.4%", sub: "↑ 2.1% this week", color: "text-green-600", bg: "bg-green-50", icon: BarChart3 },
  { label: "Average Score", value: "78.6%", sub: "↓ 1.4% this week", color: "text-orange-600", bg: "bg-orange-50", icon: BookOpen },
  { label: "Exams Conducted", value: "6", sub: "This Week", color: "text-purple-600", bg: "bg-purple-50", icon: BookOpen },
  { label: "Active Devices", value: "38", sub: "86.36% Online", color: "text-cyan-600", bg: "bg-cyan-50", icon: Monitor },
];

const attendanceData = [
  { day: "Mon 12", rate: 88 }, { day: "Tue 13", rate: 90 }, { day: "Wed 14", rate: 91 },
  { day: "Thu 15", rate: 93 }, { day: "Fri 16", rate: 92 }, { day: "Sat 17", rate: 89 }, { day: "Sun 18", rate: 92.4 },
];

const scoreData = [
  { day: "Mon 12", score: 79 }, { day: "Tue 13", score: 78 }, { day: "Wed 14", score: 77 },
  { day: "Thu 15", score: 79 }, { day: "Fri 16", score: 80 }, { day: "Sat 17", score: 78 }, { day: "Sun 18", score: 78.6 },
];

const perfPie = [
  { name: "90% and above", value: 20, color: "#10b981" },
  { name: "75% – 89%", value: 36, color: "#3b82f6" },
  { name: "60% – 74%", value: 30, color: "#f59e0b" },
  { name: "Below 60%", value: 14, color: "#ef4444" },
];

const topSubjects = [
  { name: "AI & ML Basics", avg: "88.1%", students: 57, trend: "↑" },
  { name: "Data Structures", avg: "84.2%", students: 60, trend: "↑" },
  { name: "Database Management", avg: "81.3%", students: 62, trend: "↗" },
  { name: "Web Technologies", avg: "79.2%", students: 61, trend: "↘" },
  { name: "Operating Systems", avg: "76.5%", students: 58, trend: "↓" },
];

const classwiseAttendance = [
  { class: "CSE 4A", rate: "94.1%", students: 60, trend: "↑" },
  { class: "CSE 4B", rate: "91.3%", students: 62, trend: "↑" },
  { class: "CSE 3A", rate: "89.6%", students: 58, trend: "↗" },
  { class: "CSE 3B", rate: "87.6%", students: 61, trend: "↘" },
  { class: "CSE 2A", rate: "85.2%", students: 57, trend: "→" },
];

const recentReports = [
  { name: "Weekly Overview Report", date: "May 18, 2025 • 9:00 AM", icon: FileText, color: "text-blue-500" },
  { name: "Student Performance Report", date: "May 18, 2025 • 8:45 AM", icon: Users, color: "text-green-500" },
  { name: "Attendance Report", date: "May 18, 2025 • 8:30 AM", icon: BarChart3, color: "text-orange-500" },
  { name: "Environment Report", date: "May 18, 2025 • 8:15 AM", icon: FileText, color: "text-purple-500" },
  { name: "Device Usage Report", date: "May 18, 2025 • 8:00 AM", icon: Monitor, color: "text-cyan-500" },
];

export default function Reports() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate insights and analytics across your institution.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">May 12 – May 18, 2025</div>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg">
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
              <div className={`w-9 h-9 bg-white/60 rounded-lg flex items-center justify-center mb-2`}>
                <Icon size={16} className={s.color} />
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        {/* Attendance Overview */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Attendance Overview</h2>
            <select className="text-xs border border-gray-200 rounded px-2 py-1"><option>This Week</option></select>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={attendanceData}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis domain={[80, 100]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Score Trend */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Average Score Trend</h2>
            <select className="text-xs border border-gray-200 rounded px-2 py-1"><option>This Week</option></select>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={scoreData}>
              <XAxis dataKey="day" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis domain={[60, 90]} tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v) => `${v}%`} />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Student Performance Distribution</h2>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <PieChart width={90} height={90}>
                <Pie data={perfPie} cx={40} cy={40} innerRadius={22} outerRadius={40} dataKey="value" strokeWidth={0}>
                  {perfPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10 }} />
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center"><div className="text-xs font-bold text-gray-800">520</div><div className="text-xs text-gray-400">Students</div></div>
              </div>
            </div>
            <div className="space-y-1">
              {perfPie.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }}></span>
                  <span className="text-gray-600">{d.name} <span className="font-semibold">{d.value}%</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Recent Reports</h2>
          </div>
          <div className="space-y-3">
            {recentReports.map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gray-50 rounded flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className={r.color} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">{r.name}</div>
                    <div className="text-xs text-gray-400">{r.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-2 text-xs text-blue-600 hover:underline">View all reports</button>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Top Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Top Performing Subjects</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-3 py-2 text-left text-gray-500">Subject</th><th className="px-3 py-2 text-left text-gray-500">Avg Score</th><th className="px-3 py-2 text-left text-gray-500">Students</th><th className="px-3 py-2 text-left text-gray-500">Trend</th></tr></thead>
              <tbody>
                {topSubjects.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50"><td className="px-3 py-2 text-gray-700">{s.name}</td><td className="px-3 py-2 font-semibold text-green-600">{s.avg}</td><td className="px-3 py-2 text-gray-500">{s.students}</td><td className="px-3 py-2 font-bold text-green-500">{s.trend}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-100"><button className="text-xs text-blue-600 hover:underline">View all subjects</button></div>
        </div>

        {/* Attendance by Class */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800 text-sm">Attendance by Class</h2>
            <select className="text-xs border border-gray-200 rounded px-2 py-1"><option>This Week</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-3 py-2 text-left text-gray-500">Class</th><th className="px-3 py-2 text-left text-gray-500">Att. Rate</th><th className="px-3 py-2 text-left text-gray-500">Students</th><th className="px-3 py-2 text-left text-gray-500">Trend</th></tr></thead>
              <tbody>
                {classwiseAttendance.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50"><td className="px-3 py-2 text-gray-700">{c.class}</td><td className="px-3 py-2 font-semibold text-blue-600">{c.rate}</td><td className="px-3 py-2 text-gray-500">{c.students}</td><td className="px-3 py-2 font-bold text-green-500">{c.trend}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-gray-100"><button className="text-xs text-blue-600 hover:underline">View all classes</button></div>
        </div>

        {/* Exam Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Exam Summary</h2>
          <div className="flex justify-center">
            <div className="relative">
              <PieChart width={110} height={110}>
                <Pie data={[{v:18,c:"#10b981"},{v:6,c:"#f59e0b"},{v:0,c:"#ef4444"}].filter(d=>d.v>0).map(d=>({value:d.v,color:d.c}))} cx={50} cy={50} innerRadius={28} outerRadius={45} dataKey="value" strokeWidth={0}>
                  {[{v:18,c:"#10b981"},{v:6,c:"#f59e0b"},{v:0,c:"#ef4444"}].map((d, i) => <Cell key={i} fill={d.c} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10 }} />
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center"><div className="text-base font-bold text-gray-800">24</div><div className="text-xs text-gray-400">Exams</div></div>
              </div>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {[{n:"Completed",v:18,c:"#10b981"},{n:"Upcoming",v:6,c:"#f59e0b"},{n:"Cancelled",v:0,c:"#ef4444"}].map((d) => (
              <div key={d.n} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.c}}></span>
                <span className="text-gray-600 flex-1">{d.n}</span>
                <span className="font-semibold">{d.v}</span>
              </div>
            ))}
          </div>
          <button className="mt-2 text-xs text-blue-600 hover:underline">View exam calendar</button>
        </div>

        {/* Download + Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Download Reports</h3>
            {["Weekly Report (PDF)", "Monthly Report (PDF)", "Custom Report (Excel)"].map((r) => (
              <button key={r} className="w-full flex items-center gap-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2">
                <Download size={13} className="text-red-500" /> {r}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Quick Actions</h3>
            {["Generate Custom Report", "Schedule Report", "Report Settings", "Data Export History"].map((a) => (
              <button key={a} className="w-full text-left text-xs text-gray-600 hover:bg-gray-50 rounded-lg px-3 py-2">{a} ›</button>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 text-xs text-gray-500">
            📊 Reports are updated in real-time.<br />
            <span className="text-gray-400">Last updated: May 18, 2025 • 9:15 AM</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">ℹ All data is updated in real-time. Click on any chart or table for more details.</p>
    </div>
  );
}
