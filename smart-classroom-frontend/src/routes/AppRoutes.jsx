import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute  from "./PrivateRoute";
import RoleRoute     from "./RoleRoute";

// Auth pages (public)
import Login          from "../pages/auth/Login";
import Register       from "../pages/auth/Register";
import ForgetPassword from "../pages/auth/ForgetPassword";

// Dashboard (role-based content inside the page itself)
import Dashboard from "../pages/admin/Dashboard";

// Admin / HOD managed pages
import StudentList  from "../pages/student/StudentList";
import TeacherList  from "../pages/teacher/TeacherList";
import Attendance        from "../pages/attendance/Attendance";
import TakeAttendance    from "../pages/attendance/TakeAttendance";
import AttendanceReport  from "../pages/attendance/AttendanceReport";
import Timetable    from "../pages/timetable/Timetable";
import Subjects     from "../pages/subjects/Subjects";
import Classrooms   from "../pages/classrooms/Classrooms";
import Devices      from "../pages/devices/Devices";
import Environment  from "../pages/environment/Environment";
import Exams        from "../pages/exams/Exams";
import AIAssistant  from "../pages/ai/AIAssistant";
import Reports      from "../pages/reports/Reports";
import Notifications from "../pages/notifications/Notifications";
import Settings     from "../pages/settings/Settings";

// Shared across staff
import Departments  from "../pages/departments/Departments";
import Semesters    from "../pages/semesters/Semesters";

// Admin-only
import UserManagement     from "../pages/admin/UserManagement";
import SemesterPromotion from "../pages/semester/SemesterPromotion";

// New Module: Student Registration + Face Registration
import StudentSelfRegister from "../pages/auth/StudentSelfRegister";
import StudentImport       from "../pages/student/StudentImport";
import FaceRegistration    from "../pages/student/FaceRegistration";

// Academic Calendar Module
import AcademicCalendar   from "../pages/calendar/AcademicCalendar";

// Section Manager + Timetable Builder
import SectionManager     from "../pages/sections/SectionManager";
import TimetableBuilder   from "../pages/timetable/TimetableBuilder";

// Classroom Capacity Report
import ClassroomCapacity  from "../pages/classrooms/ClassroomCapacity";

// Student profile
import StudentProfile from "../pages/student/StudentProfile";
import LiveBusTracking from "../pages/student/LiveBusTracking";

import AccessDenied from "../components/common/AccessDenied";
import VoiceTest    from "../pages/VoiceTest";

const ALL   = ["SUPER_ADMIN","ADMIN","HOD","TEACHER","STUDENT"];
const STAFF = ["SUPER_ADMIN","ADMIN","HOD","TEACHER"];
const MGMT  = ["SUPER_ADMIN","ADMIN","HOD"];
const ADMIN_ROLES = ["SUPER_ADMIN","ADMIN"];
const SA_ADMIN = ["SUPER_ADMIN","ADMIN"];

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ── */}
        <Route path="/"                element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/403"             element={<div className="p-8"><AccessDenied /></div>} />

        {/* ── Voice-to-text diagnostic (PUBLIC — no auth needed) ── */}
        <Route path="/voice-test"       element={<VoiceTest />} />

        {/* ── Student Self-Registration (PUBLIC — no auth) ── */}
        <Route path="/student-register" element={<StudentSelfRegister />} />

        {/* ── Dashboard (all roles, content differs inside) ── */}
        <Route path="/dashboard" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Dashboard /></RoleRoute></PrivateRoute>
        } />

        {/* ── Students ── */}
        <Route path="/students" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><StudentList /></RoleRoute></PrivateRoute>
        } />

        {/* ── Teachers ── */}
        <Route path="/teachers" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><TeacherList /></RoleRoute></PrivateRoute>
        } />

        {/* ── Departments (ADMIN+) ── */}
        <Route path="/departments" element={
          <PrivateRoute><RoleRoute allowedRoles={MGMT}><Departments /></RoleRoute></PrivateRoute>
        } />

        {/* ── Semesters (ADMIN+) ── */}
        <Route path="/semesters" element={
          <PrivateRoute><RoleRoute allowedRoles={MGMT}><Semesters /></RoleRoute></PrivateRoute>
        } />

        {/* ── Subjects ── */}
        <Route path="/subjects" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Subjects /></RoleRoute></PrivateRoute>
        } />

        {/* ── Classrooms (ADMIN only for edit; all can view) ── */}
        <Route path="/classrooms" element={
          <PrivateRoute><RoleRoute allowedRoles={ADMIN_ROLES}><Classrooms /></RoleRoute></PrivateRoute>
        } />

        {/* ── Classroom Capacity Report (ADMIN only) ── */}
        <Route path="/classrooms/capacity" element={
          <PrivateRoute><RoleRoute allowedRoles={ADMIN_ROLES}><ClassroomCapacity /></RoleRoute></PrivateRoute>
        } />

        {/* ── Timetable ── */}
        <Route path="/timetable" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Timetable /></RoleRoute></PrivateRoute>
        } />

        {/* ── Timetable Builder wizard (STAFF only) ── */}
        <Route path="/timetable/builder" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><TimetableBuilder /></RoleRoute></PrivateRoute>
        } />

        {/* ── Section Manager (STAFF only) ── */}
        <Route path="/sections" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><SectionManager /></RoleRoute></PrivateRoute>
        } />

        {/* ── Attendance ── */}
        <Route path="/attendance" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Attendance /></RoleRoute></PrivateRoute>
        } />

        {/* ── Take Attendance via Face Recognition (STAFF only) ── */}
        <Route path="/attendance/take" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><TakeAttendance /></RoleRoute></PrivateRoute>
        } />

        {/* ── Attendance Report ── */}
        <Route path="/attendance/report" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><AttendanceReport /></RoleRoute></PrivateRoute>
        } />

        {/* ── Exams & Marks ── */}
        <Route path="/exams" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Exams /></RoleRoute></PrivateRoute>
        } />

        {/* ── AI Assistant ── */}
        <Route path="/ai-assistant" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><AIAssistant /></RoleRoute></PrivateRoute>
        } />

        {/* ── Devices ── */}
        <Route path="/devices" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><Devices /></RoleRoute></PrivateRoute>
        } />

        {/* ── Environment ── */}
        <Route path="/environment" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Environment /></RoleRoute></PrivateRoute>
        } />

        {/* ── Reports ── */}
        <Route path="/reports" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Reports /></RoleRoute></PrivateRoute>
        } />

        {/* ── Notifications ── */}
        <Route path="/notifications" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><Notifications /></RoleRoute></PrivateRoute>
        } />

        {/* ── Settings (ADMIN only) ── */}
        <Route path="/settings" element={
          <PrivateRoute><RoleRoute allowedRoles={SA_ADMIN}><Settings /></RoleRoute></PrivateRoute>
        } />

        {/* ── Semester Promotion (HOD / ADMIN / SA) ── */}
        <Route path="/semester-promotion" element={
          <PrivateRoute><RoleRoute allowedRoles={MGMT}><SemesterPromotion /></RoleRoute></PrivateRoute>
        } />

        {/* ── Student Import (ADMIN / SA only) ── */}
        <Route path="/student-import" element={
          <PrivateRoute><RoleRoute allowedRoles={SA_ADMIN}><StudentImport /></RoleRoute></PrivateRoute>
        } />

        {/* ── Face Registration (TEACHER / HOD / ADMIN / SA) ── */}
        <Route path="/face-registration" element={
          <PrivateRoute><RoleRoute allowedRoles={STAFF}><FaceRegistration /></RoleRoute></PrivateRoute>
        } />

        {/* ── User Management (SUPER_ADMIN + ADMIN) ── */}
        <Route path="/admin-management" element={
          <PrivateRoute><RoleRoute allowedRoles={SA_ADMIN}><UserManagement /></RoleRoute></PrivateRoute>
        } />

        {/* ── Academic Calendar (ADMIN / HOD / SA) ── */}
        <Route path="/academic-calendar" element={
          <PrivateRoute><RoleRoute allowedRoles={MGMT}><AcademicCalendar /></RoleRoute></PrivateRoute>
        } />

        {/* ── Student Profile (students view own profile) ── */}
        <Route path="/profile" element={
          <PrivateRoute><RoleRoute allowedRoles={ALL}><StudentProfile /></RoleRoute></PrivateRoute>
        } />

        {/* ── Live Bus Tracking: STUDENT role ONLY ── */}
        <Route path="/bus-tracking" element={
          <PrivateRoute><RoleRoute allowedRoles={["STUDENT"]}><LiveBusTracking /></RoleRoute></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
