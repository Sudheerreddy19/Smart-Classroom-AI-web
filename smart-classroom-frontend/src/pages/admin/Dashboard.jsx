import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Users, UserCheck, GraduationCap, BookOpen, Monitor,
  Thermometer, Droplets, Wind, Leaf, AlertTriangle,
  UserCog, CheckSquare, Plus, RefreshCw, Shield, Bot, Bus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchDashboardStats, selectDashboard } from "../../store/slices/dashboardSlice";
import { selectUser } from "../../store/slices/authSlice";
import { usePermissions } from "../../hooks/usePermissions";
import { PageLoader } from "../../components/common/Spinner";
import { useNavigate } from "react-router-dom";

// Static chart data (will be replaced by real data when API returns it)
const attendanceTrend = [
  { day:"Mon",rate:78 },{ day:"Tue",rate:82 },{ day:"Wed",rate:79 },
  { day:"Thu",rate:88 },{ day:"Fri",rate:85 },{ day:"Sat",rate:90 },
];

const subjectPie = [
  { name:"Data Structures",value:88,color:"#3b82f6" },
  { name:"DBMS",value:86,color:"#10b981" },
  { name:"OS",value:84,color:"#f59e0b" },
  { name:"AI",value:83,color:"#8b5cf6" },
];

// ── Role-based welcome messages ───────────────────────────────────────────────
const ROLE_WELCOME = {
  SUPER_ADMIN: { title:"System Overview",      sub:"Full control over all operations and users." },
  ADMIN:       { title:"Admin Dashboard",       sub:"Manage the institution's academic operations." },
  HOD:         { title:"Department Dashboard",  sub:"Oversee your department's teachers and students." },
  TEACHER:     { title:"Teacher Dashboard",     sub:"Manage your classes, attendance, and marks." },
  STUDENT:     { title:"Student Dashboard",     sub:"View your attendance, marks, and schedule." },
};

// ── Stat cards shown per role ─────────────────────────────────────────────────
function getStatCards(stats, role) {
  const s = stats || {};
  const all = [
    { key:"students", label:"Total Students",  value:s.totalStudents??0,     sub:"Enrolled",        icon:Users,          iconBg:"bg-blue-100",   iconColor:"text-blue-600",   roles:["SUPER_ADMIN","ADMIN","HOD","TEACHER"] },
    { key:"present",  label:"Present Today",   value:s.totalPresentStudents??0,sub:`${(s.avgAttendanceRate??0).toFixed(1)}%`,icon:UserCheck,iconBg:"bg-green-100",  iconColor:"text-green-600",  roles:["SUPER_ADMIN","ADMIN","HOD","TEACHER"] },
    { key:"teachers", label:"Total Teachers",  value:s.totalTeachers??0,     sub:"Active staff",    icon:GraduationCap,  iconBg:"bg-purple-100", iconColor:"text-purple-600", roles:["SUPER_ADMIN","ADMIN","HOD"] },
    { key:"classes",  label:"Today's Sessions",value:s.todayAttendanceSessions??0,sub:"Ongoing",   icon:BookOpen,       iconBg:"bg-orange-100", iconColor:"text-orange-600", roles:["SUPER_ADMIN","ADMIN","HOD","TEACHER"] },
    { key:"devices",  label:"Active Devices",  value:`${s.onlineDevices??0}/${s.totalDevices??0}`,sub:"Online",icon:Monitor,iconBg:"bg-cyan-100",   iconColor:"text-cyan-600",   roles:["SUPER_ADMIN","ADMIN","HOD","TEACHER"] },
    { key:"depts",    label:"Departments",     value:s.totalDepartments??0,  sub:"Active",          icon:Shield,         iconBg:"bg-indigo-100", iconColor:"text-indigo-600", roles:["SUPER_ADMIN","ADMIN"] },
  ];
  return all.filter(c => c.roles.includes(role));
}

export default function Dashboard() {
  const dispatch   = useDispatch();
  const { stats, loading } = useSelector(selectDashboard);
  const user       = useSelector(selectUser);
  const { role, isStudent, isAdmin, isTeacher } = usePermissions();
  const navigate   = useNavigate();

  useEffect(() => { dispatch(fetchDashboardStats()); }, [dispatch]);

  const welcome   = ROLE_WELCOME[role] || ROLE_WELCOME.ADMIN;
  const statCards = getStatCards(stats, role);
  const s = stats || {};

  const pieData = [
    { name:"Present",value:s.totalPresentStudents||85,  color:"#3b82f6" },
    { name:"Absent", value:(s.totalStudents||100)-(s.totalPresentStudents||85), color:"#ef4444" },
  ];

  const envSummary = s.environmentSummary || {};

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{welcome.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, <span className="font-semibold text-gray-700">{user?.firstName}</span> 👋 — {welcome.sub}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => dispatch(fetchDashboardStats())}
            className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="text-sm text-gray-500 bg-white border border-gray-200 rounded-lg px-3 py-2">
            {new Date().toLocaleDateString("en-IN",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}
          </div>
        </div>
      </div>

      {/* ── Role badge ── */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
          role==="SUPER_ADMIN"?"bg-red-100 text-red-700":
          role==="ADMIN"?"bg-blue-100 text-blue-700":
          role==="HOD"?"bg-purple-100 text-purple-700":
          role==="TEACHER"?"bg-green-100 text-green-700":
          "bg-orange-100 text-orange-700"
        }`}>
          {role?.replace("_"," ")}
        </span>
        <span className="text-xs text-gray-400">Logged in as {user?.email}</span>
      </div>

      {/* ── Stat Cards ── */}
      {loading ? <PageLoader /> : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
                  <Icon size={18} className={card.iconColor} />
                </div>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
                <div className="text-xs mt-1 font-medium text-green-600">{card.sub}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Student quick cards ── */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label:"My Attendance",  path:"/attendance",  color:"bg-blue-600",   icon:UserCheck, actionText: "View now →" },
            { label:"My Marks",       path:"/exams",        color:"bg-green-600",  icon:BookOpen,  actionText: "View now →" },
            { label:"AI Assistant",   path:"/ai-assistant", color:"bg-purple-600", icon:Bot,       actionText: "Chat now →" },
            { label:"Live Bus Tracking", path:"/bus-tracking", color:"bg-indigo-600", icon:Bus, badge:"LIVE", actionText: "Track now →" },
          ].map(q => {
            const Icon = q.icon;
            return (
              <button key={q.label} onClick={() => navigate(q.path)}
                className={`${q.color} hover:opacity-95 text-white rounded-xl p-5 text-left shadow-sm transition relative overflow-hidden group`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon size={24} className="opacity-90" />
                  {q.badge && (
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
                      {q.badge}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-base">{q.label}</div>
                <div className="text-white/80 text-xs mt-1">{q.actionText}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Admin/HOD/Teacher view ── */}
      {!isStudent && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Live Classroom Feed */}
          <div className="xl:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 text-sm">Live Classroom – Room 101</h2>
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>LIVE
              </span>
            </div>
            <div className="relative bg-gray-900" style={{aspectRatio:"16/9"}}>
              <img src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop"
                alt="classroom" className="w-full h-full object-cover opacity-80" />
              <div className="absolute bottom-2 left-3 flex gap-4 text-xs text-white">
                <span>● Detected Faces: 23</span><span>FPS: 18.7</span>
              </div>
            </div>
            <div className="p-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition">
                View Full Screen ↗
              </button>
            </div>
          </div>

          {/* Today's Overview */}
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h2 className="font-semibold text-gray-800 text-sm mb-4">Today's Overview</h2>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <PieChart width={80} height={80}>
                    <Pie data={pieData} cx={35} cy={35} innerRadius={22} outerRadius={35} dataKey="value" strokeWidth={0}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">{(s.avgAttendanceRate||85).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span><span className="text-gray-600">Present</span><span className="font-semibold ml-auto">{s.totalPresentStudents||"—"}</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span><span className="text-gray-600">Absent</span><span className="font-semibold ml-auto">{(s.totalStudents&&s.totalPresentStudents)?s.totalStudents-s.totalPresentStudents:"—"}</span></div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Active Classrooms</span><span className="font-semibold text-blue-600">{s.activeClassrooms||"—"}</span></div>
                <div className="flex justify-between text-gray-600"><span>Attendance Rate</span><span className="font-semibold text-gray-800">{(s.avgAttendanceRate||0).toFixed(1)}%</span></div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 text-sm">Recent Alerts</h2>
                <button onClick={() => navigate("/notifications")} className="text-blue-600 text-xs hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {[
                  {icon:Thermometer,color:"text-red-500 bg-red-50",   text:"High Temperature in Room 102",time:"10:21 AM"},
                  {icon:UserCog,    color:"text-blue-500 bg-blue-50",  text:"Teacher Detected in Room 101",time:"10:20 AM"},
                  {icon:Monitor,    color:"text-cyan-500 bg-cyan-50",  text:"Projector ON in Room 101",    time:"10:19 AM"},
                  {icon:Plus,       color:"text-green-500 bg-green-50",text:"New Assignment Added",         time:"Yesterday"},
                  {icon:CheckSquare,color:"text-green-500 bg-green-50",text:"Attendance Marked",            time:"Yesterday"},
                ].map((a,i) => {
                  const Icon = a.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color}`}><Icon size={13} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">{a.text}</p>
                        <p className="text-xs text-gray-400">{a.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Charts Row (admin/hod/teacher) ── */}
      {!isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Attendance Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Attendance Trend</h2>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={attendanceTrend}>
                <XAxis dataKey="day" tick={{fontSize:10}} tickLine={false} axisLine={false} />
                <YAxis domain={[60,100]} tick={{fontSize:10}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{fontSize:11}} formatter={v=>`${v}%`} />
                <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Attendance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Subject Attendance</h2>
            <div className="flex items-center gap-3">
              <PieChart width={90} height={90}>
                <Pie data={subjectPie} cx={40} cy={40} innerRadius={24} outerRadius={40} dataKey="value" strokeWidth={0}>
                  {subjectPie.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="space-y-1 text-xs flex-1">
                {subjectPie.map((s,i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{backgroundColor:s.color}}></span>
                    <span className="text-gray-600 truncate flex-1">{s.name}</span>
                    <span className="font-semibold">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Environment</h2>
              <button onClick={()=>navigate("/environment")} className="text-blue-600 text-xs hover:underline">Full Report</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-orange-50 rounded-lg p-2.5 text-center">
                <Thermometer size={16} className="text-orange-500 mx-auto mb-1"/>
                <div className="text-sm font-bold text-gray-800">{envSummary.temperature??28}°C</div>
                <div className="text-xs text-green-600">Normal</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 text-center">
                <Droplets size={16} className="text-blue-500 mx-auto mb-1"/>
                <div className="text-sm font-bold text-gray-800">{envSummary.humidity??56}%</div>
                <div className="text-xs text-green-600">Normal</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2.5 text-center">
                <Leaf size={16} className="text-green-500 mx-auto mb-1"/>
                <div className="text-sm font-bold text-gray-800">{envSummary.airQualityIndex??42} AQI</div>
                <div className="text-xs text-green-600">Good</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                <Wind size={16} className="text-gray-500 mx-auto mb-1"/>
                <div className="text-sm font-bold text-gray-800">{envSummary.co2Level??620} ppm</div>
                <div className="text-xs text-green-600">Normal</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-800 text-sm mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                {label:"Take Attendance",   path:"/attendance",         show:!isStudent,  color:"text-blue-600" },
                {label:"Manage Sections",   path:"/sections",           show:!isStudent,  color:"text-green-600" },
                {label:"Build Timetable",   path:"/timetable/builder",  show:!isStudent,  color:"text-purple-600" },
                {label:"Classroom Capacity",path:"/classrooms/capacity",show:!isStudent,  color:"text-orange-600" },
                {label:"View Reports",      path:"/reports",            show:true,        color:"text-indigo-600" },
                {label:"AI Assistant",      path:"/ai-assistant",       show:true,        color:"text-indigo-600" },
              ].filter(a=>a.show).slice(0,5).map(a => (
                <button key={a.label} onClick={()=>navigate(a.path)}
                  className={`w-full text-left text-xs ${a.color} hover:bg-gray-50 rounded-lg px-3 py-2 transition font-medium`}>
                  {a.label} →
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
