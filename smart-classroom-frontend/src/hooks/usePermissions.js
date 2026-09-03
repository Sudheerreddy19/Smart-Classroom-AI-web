import { useSelector } from "react-redux";
import { selectUser } from "../store/slices/authSlice";

/**
 * Central permission hook — mirrors the backend RoleValidator RBAC matrix exactly.
 *
 * CREATE / UPDATE / DELETE matrix:
 *   SUPER_ADMIN → ADMIN, HOD, TEACHER, STUDENT
 *   ADMIN       → HOD, TEACHER, STUDENT
 *   HOD         → TEACHER, STUDENT
 *   TEACHER     → STUDENT only
 *   STUDENT     → NONE
 *
 * Usage:
 *   const { isAdmin, canCreateStudent, canEditTeacher, role } = usePermissions();
 */
export function usePermissions() {
  const user = useSelector(selectUser);
  const role = user?.role || "";

  const is    = (r)       => role === r;
  const hasAny = (...roles) => roles.includes(role);

  return {
    role,
    user,

    // ── Role identity checks ────────────────────────────────────────────────
    isSuperAdmin: is("SUPER_ADMIN"),
    isAdmin:      hasAny("SUPER_ADMIN", "ADMIN"),
    isHOD:        hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    isTeacher:    hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    isStudent:    is("STUDENT"),
    isStaff:      hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),

    // ── Audit log ─────────────────────────────────────────────────────────
    canViewAuditLog: hasAny("SUPER_ADMIN", "ADMIN"),

    // ── Student permissions (TEACHER can create/edit/delete students) ──────
    canCreateStudent: hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canEditStudent:   hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canDeleteStudent: hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canViewStudents:  hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),

    // ── Teacher permissions (TEACHER cannot manage other teachers) ────────
    canCreateTeacher: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canEditTeacher:   hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canDeleteTeacher: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canViewTeachers:  hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),

    // ── Admin/HOD management ─────────────────────────────────────────────
    canCreateAdmin: is("SUPER_ADMIN"),
    canEditAdmin:   is("SUPER_ADMIN"),
    canDeleteAdmin: is("SUPER_ADMIN"),

    canCreateHOD: hasAny("SUPER_ADMIN", "ADMIN"),
    canEditHOD:   hasAny("SUPER_ADMIN", "ADMIN"),
    canDeleteHOD: hasAny("SUPER_ADMIN", "ADMIN"),

    // ── Academic (subjects, semesters, departments) ───────────────────────
    canManageAcademic: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canViewAcademic:   hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Attendance ────────────────────────────────────────────────────────
    canTakeAttendance:   hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canDeleteAttendance: hasAny("SUPER_ADMIN", "ADMIN"),
    canViewAttendance:   hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Marks ─────────────────────────────────────────────────────────────
    canAddMarks:    hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canDeleteMarks: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canViewMarks:   hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Devices ───────────────────────────────────────────────────────────
    canManageDevices:  hasAny("SUPER_ADMIN", "ADMIN"),
    canControlDevices: hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER"),
    canViewDevices:    hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Environment ──────────────────────────────────────────────────────
    canViewEnvironment: hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Classrooms & Timetable ────────────────────────────────────────────
    canManageClassrooms:  hasAny("SUPER_ADMIN", "ADMIN"),
    canManageTimetable:   hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canViewTimetable:     hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // ── Settings ─────────────────────────────────────────────────────────
    canAccessSettings: hasAny("SUPER_ADMIN", "ADMIN"),

    // ── User management ───────────────────────────────────────────────────
    canManageUsers: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),

    // ── Reports ───────────────────────────────────────────────────────────
    canViewAllReports: hasAny("SUPER_ADMIN", "ADMIN", "HOD"),
    canViewOwnReports: hasAny("TEACHER", "STUDENT"),

    // ── AI ────────────────────────────────────────────────────────────────
    canUseAI: hasAny("SUPER_ADMIN", "ADMIN", "HOD", "TEACHER", "STUDENT"),

    // Generic has-any helper
    hasAny,
  };
}
