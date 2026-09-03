import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard, Users, GraduationCap, CalendarDays, ClipboardCheck,
  BookOpen, Bot, Monitor, Leaf, BarChart3, Bell, Settings, ChevronLeft,
  LogOut, Building2, Cpu, ShieldCheck, User, FileText, Layers, TrendingUp,
  Camera, Upload, CalendarRange,
} from "lucide-react";
import { useState } from "react";
import { selectUser, logoutUser } from "../../store/slices/authSlice";
import { selectNotifications } from "../../store/slices/notificationSlice";

// ── Menu definitions per role ─────────────────────────────────────────────────

const MENUS = {
  SUPER_ADMIN: [
    { icon: LayoutDashboard, title: "Dashboard",          path: "/dashboard" },
    { icon: ShieldCheck,     title: "Admins",              path: "/admin-management" },
    { icon: Users,           title: "Students",            path: "/students" },
    { icon: Upload,          title: "Import Students",     path: "/student-import" },
    { icon: GraduationCap,   title: "Teachers",            path: "/teachers" },
    { icon: Camera,          title: "Face Registration",   path: "/face-registration" },
    { icon: Building2,       title: "Departments",         path: "/departments" },
    { icon: BookOpen,        title: "Subjects",            path: "/subjects" },
    { icon: Layers,          title: "Semesters",           path: "/semesters" },
    { icon: TrendingUp,      title: "Sem Promotion",       path: "/semester-promotion" },
    { icon: CalendarRange,   title: "Academic Calendar",   path: "/academic-calendar" },
    { icon: Monitor,         title: "Classrooms",          path: "/classrooms" },
    { icon: CalendarDays,    title: "Timetable",           path: "/timetable" },
    { icon: ClipboardCheck,  title: "Attendance",          path: "/attendance" },
    { icon: FileText,        title: "Exams & Marks",       path: "/exams" },
    { icon: Bot,             title: "AI Assistant",        path: "/ai-assistant" },
    { icon: Cpu,             title: "Devices",             path: "/devices" },
    { icon: Leaf,            title: "Environment",         path: "/environment" },
    { icon: BarChart3,       title: "Reports",             path: "/reports" },
    { icon: Bell,            title: "Notifications",       path: "/notifications", showBadge: true },
    { icon: Settings,        title: "Settings",            path: "/settings" },
  ],

  ADMIN: [
    { icon: LayoutDashboard, title: "Dashboard",          path: "/dashboard" },
    { icon: Users,           title: "Students",            path: "/students" },
    { icon: Upload,          title: "Import Students",     path: "/student-import" },
    { icon: GraduationCap,   title: "Teachers",            path: "/teachers" },
    { icon: Camera,          title: "Face Registration",   path: "/face-registration" },
    { icon: Building2,       title: "Departments",         path: "/departments" },
    { icon: BookOpen,        title: "Subjects",            path: "/subjects" },
    { icon: Layers,          title: "Semesters",           path: "/semesters" },
    { icon: TrendingUp,      title: "Sem Promotion",       path: "/semester-promotion" },
    { icon: CalendarRange,   title: "Academic Calendar",   path: "/academic-calendar" },
    { icon: Monitor,         title: "Classrooms",          path: "/classrooms" },
    { icon: CalendarDays,    title: "Timetable",           path: "/timetable" },
    { icon: ClipboardCheck,  title: "Attendance",          path: "/attendance" },
    { icon: FileText,        title: "Exams & Marks",       path: "/exams" },
    { icon: Bot,             title: "AI Assistant",        path: "/ai-assistant" },
    { icon: Cpu,             title: "Devices",             path: "/devices" },
    { icon: Leaf,            title: "Environment",         path: "/environment" },
    { icon: BarChart3,       title: "Reports",             path: "/reports" },
    { icon: Bell,            title: "Notifications",       path: "/notifications", showBadge: true },
    { icon: Settings,        title: "Settings",            path: "/settings" },
  ],

  HOD: [
    { icon: LayoutDashboard, title: "Dashboard",          path: "/dashboard" },
    { icon: Users,           title: "Students",            path: "/students" },
    { icon: GraduationCap,   title: "Teachers",            path: "/teachers" },
    { icon: Camera,          title: "Face Registration",   path: "/face-registration" },
    { icon: BookOpen,        title: "Subjects",            path: "/subjects" },
    { icon: TrendingUp,      title: "Sem Promotion",       path: "/semester-promotion" },
    { icon: CalendarRange,   title: "Academic Calendar",   path: "/academic-calendar" },
    { icon: CalendarDays,    title: "Timetable",           path: "/timetable" },
    { icon: ClipboardCheck,  title: "Attendance",          path: "/attendance" },
    { icon: FileText,        title: "Exams & Marks",       path: "/exams" },
    { icon: Bot,             title: "AI Assistant",        path: "/ai-assistant" },
    { icon: BarChart3,       title: "Reports",             path: "/reports" },
    { icon: Bell,            title: "Notifications",       path: "/notifications", showBadge: true },
  ],

  TEACHER: [
    { icon: LayoutDashboard, title: "Dashboard",     path: "/dashboard" },
    { icon: Users,           title: "Students",      path: "/students" },
    { icon: Camera,          title: "Face Capture",  path: "/face-registration" },
    { icon: ClipboardCheck,  title: "Attendance",    path: "/attendance" },
    { icon: FileText,        title: "Exams & Marks", path: "/exams" },
    { icon: CalendarDays,    title: "Timetable",     path: "/timetable" },
    { icon: Bot,             title: "AI Assistant",  path: "/ai-assistant" },
    { icon: Cpu,             title: "Devices",       path: "/devices" },
    { icon: BarChart3,       title: "Reports",       path: "/reports" },
    { icon: Bell,            title: "Notifications", path: "/notifications", showBadge: true },
  ],

  STUDENT: [
    { icon: LayoutDashboard, title: "Dashboard",     path: "/dashboard" },
    { icon: ClipboardCheck,  title: "My Attendance", path: "/attendance" },
    { icon: FileText,        title: "My Marks",      path: "/exams" },
    { icon: CalendarDays,    title: "Timetable",     path: "/timetable" },
    { icon: Bot,             title: "AI Assistant",  path: "/ai-assistant" },
    { icon: User,            title: "My Profile",    path: "/profile" },
    { icon: Bell,            title: "Notifications", path: "/notifications", showBadge: true },
  ],
};

const ROLE_COLORS = {
  SUPER_ADMIN: "bg-red-600",
  ADMIN:       "bg-blue-600",
  HOD:         "bg-purple-600",
  TEACHER:     "bg-green-600",
  STUDENT:     "bg-orange-500",
};

const ROLE_LABELS = {
  SUPER_ADMIN: "Super Admin",
  ADMIN:       "Administrator",
  HOD:         "Head of Dept.",
  TEACHER:     "Teacher",
  STUDENT:     "Student",
};

export default function Sidebar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectUser);
  const { unreadCount } = useSelector(selectNotifications);
  const [collapsed, setCollapsed] = useState(false);

  const role   = user?.role || "STUDENT";
  const menus  = MENUS[role] || MENUS.STUDENT;
  const color  = ROLE_COLORS[role] || "bg-blue-600";
  const label  = ROLE_LABELS[role] || role;

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";
  const fullName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "User";

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/");
  };

  return (
    <aside className={`${collapsed ? "w-[68px]" : "w-64"} bg-[#0f1729] text-white min-h-screen flex flex-col transition-all duration-300 relative flex-shrink-0`}>

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800 h-16">
        <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-white text-sm leading-tight truncate">Smart Classroom</div>
            <div className="text-slate-400 text-xs leading-tight truncate">{label}</div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {menus.map((menu) => {
          const Icon   = menu.icon;
          const badge  = menu.showBadge && unreadCount > 0;
          return (
            <NavLink key={menu.path} to={menu.path}
              title={collapsed ? menu.title : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg transition-all text-sm mb-0.5 ${
                  isActive
                    ? `${color} text-white shadow-sm`
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`
              }
            >
              <div className="relative flex-shrink-0">
                <Icon size={17} />
                {badge && collapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{menu.title}</span>
                  {badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 font-medium">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Logout ── */}
      <div className="border-t border-slate-800 p-2">
        <button onClick={handleLogout} title={collapsed ? "Sign Out" : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition text-sm">
          <LogOut size={17} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* ── User Profile ── */}
      {!collapsed && (
        <div className="border-t border-slate-800 px-4 py-3 flex items-center gap-3">
          <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{fullName}</div>
            <div className="text-slate-400 text-xs truncate">{label}</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
        </div>
      )}

      {/* ── Collapse button ── */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-white hover:bg-slate-600 z-10 shadow">
        <ChevronLeft size={13} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </aside>
  );
}
