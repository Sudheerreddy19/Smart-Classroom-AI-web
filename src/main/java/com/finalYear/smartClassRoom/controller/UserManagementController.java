package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.RegisterRequest;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.Teacher;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.BadRequestException;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.TeacherRepository;
import com.finalYear.smartClassRoom.repository.UserRepository;
import com.finalYear.smartClassRoom.security.RoleValidator;
import com.finalYear.smartClassRoom.service.AuditLogService;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.StudentService;
import com.finalYear.smartClassRoom.service.TeacherService;
import com.finalYear.smartClassRoom.service.UserDeletionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Manages user accounts (ADMIN, HOD, TEACHER, STUDENT creation).
 * Students can also self-register via /api/auth/register.
 *
 * Role hierarchy:
 *   SUPER_ADMIN → ADMIN, HOD, TEACHER, STUDENT
 *   ADMIN       → HOD, TEACHER, STUDENT
 *   HOD         → TEACHER, STUDENT
 *   TEACHER     → STUDENT
 *   STUDENT     → none
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class UserManagementController {

    private final UserRepository            userRepository;
    private final TeacherRepository         teacherRepository;
    private final StudentRepository         studentRepository;
    private final DepartmentRepository      departmentRepository;
    private final PasswordEncoder           passwordEncoder;
    private final CurrentUserContextService currentUserCtx;
    private final RoleValidator             roleValidator;
    private final AuditLogService           auditLogService;
    private final TeacherService            teacherService;
    private final StudentService            studentService;
    private final UserDeletionService       userDeletionService;

    // ── Create user ─────────────────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<UserSummary> createUser(@Valid @RequestBody RegisterRequest req) {

        // ── Phase 3: use centralized RoleValidator ──────────────────────────
        User caller = currentUserCtx.getCaller();
        roleValidator.assertCanCreate(caller, req.getRole());

        if (userRepository.existsByEmail(req.getEmail()))
            throw new DuplicateResourceException("Email already registered: " + req.getEmail());

        // Resolve department (mandatory for HOD / TEACHER / STUDENT)
        Department department = null;
        if (req.getDepartmentId() != null) {
            department = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Department", req.getDepartmentId()));
        }

        // Require department for roles that must belong to one
        if (req.getRole() == User.Role.HOD || req.getRole() == User.Role.TEACHER
                || req.getRole() == User.Role.STUDENT) {
            if (department == null) {
                throw new BadRequestException("Department is required for role: " + req.getRole());
            }
        }

        // Create the user account
        User user = User.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(req.getRole())
                .enabled(true)
                .emailVerified(true)
                .build();

        user = userRepository.save(user);

        // Create the matching profile row
        switch (req.getRole()) {
            case HOD, TEACHER -> {
                String empId = "EMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                Teacher teacher = Teacher.builder()
                        .user(user)
                        .employeeId(empId)
                        .firstName(req.getFirstName())
                        .lastName(req.getLastName())
                        .phone(req.getPhone())
                        .department(department)
                        .active(true)
                        .build();

                teacherRepository.save(teacher);

                // If HOD, update the department's HOD reference
                if (req.getRole() == User.Role.HOD && department != null) {
                    department.setHodName(req.getFirstName() + " " + req.getLastName());
                    departmentRepository.save(department);
                }
            }
            case STUDENT -> {
                String tempRoll = "TEMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

                Student student = Student.builder()
                        .user(user)
                        .rollNumber(tempRoll)
                        .department(department)
                        .active(true)
                        .build();

                studentRepository.save(student);
            }
            case ADMIN -> {
                // ADMIN accounts need no separate profile table
            }
            default -> { /* SUPER_ADMIN — never created here */ }
        }

        auditLogService.log("USER_CREATED", "USER", user.getId(),
                String.format("%s created %s account for %s",
                        caller.getEmail(), user.getRole(), user.getEmail()));

        log.info("[UserMgmt] {} created {} ({})",
                caller.getEmail(), user.getEmail(), user.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(UserSummary.from(user));
    }

    // ── List all users (paginated, dept-filtered, role-filtered) ───────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<Page<UserSummary>> listUsers(
            @RequestParam(required = false) Long   departmentId,
            @RequestParam(required = false) String role,        // e.g. "HOD", "TEACHER", "STUDENT"
            Pageable pageable) {

        String callerRoleStr = callerRole();
        User.Role callerRole = User.Role.valueOf(callerRoleStr);

        // Determine which roles this caller can see
        java.util.Set<User.Role> visibleRoles;
        if (callerRole == User.Role.SUPER_ADMIN) {
            visibleRoles = java.util.Set.of(
                    User.Role.SUPER_ADMIN, User.Role.ADMIN,
                    User.Role.HOD, User.Role.TEACHER, User.Role.STUDENT);
        } else if (callerRole == User.Role.ADMIN) {
            visibleRoles = java.util.Set.of(
                    User.Role.HOD, User.Role.TEACHER, User.Role.STUDENT);
        } else if (callerRole == User.Role.HOD) {
            visibleRoles = java.util.Set.of(User.Role.TEACHER, User.Role.STUDENT);
        } else { // TEACHER
            visibleRoles = java.util.Set.of(User.Role.STUDENT);
        }

        // Resolve effective dept (HOD/TEACHER always use own dept)
        Long effectiveDeptId = currentUserCtx.resolveEffectiveDepartmentId(departmentId);

        // Parse the requested role filter (validate it is within visibleRoles)
        User.Role filterRole = null;
        if (role != null && !role.isBlank()) {
            try {
                User.Role requested = User.Role.valueOf(role.toUpperCase());
                if (visibleRoles.contains(requested)) {
                    filterRole = requested;
                }
            } catch (IllegalArgumentException ignored) { /* bad role string — ignore */ }
        }

        Page<User> page;
        if (filterRole != null && effectiveDeptId != null) {
            // Single role + dept
            page = userRepository.findByRoleAndDepartmentId(filterRole, effectiveDeptId, pageable);
        } else if (filterRole != null) {
            // Single role, all depts
            page = userRepository.findByRole(filterRole, pageable);
        } else if (effectiveDeptId != null) {
            // All visible roles, filtered by dept
            page = userRepository.findByRoleInAndDepartmentId(visibleRoles, effectiveDeptId, pageable);
        } else {
            // All visible roles, no dept filter
            page = userRepository.findByRoleIn(visibleRoles, pageable);
        }

        List<UserSummary> content = page.getContent()
                .stream().map(UserSummary::from).collect(Collectors.toList());
        return ResponseEntity.ok(new PageImpl<>(content, pageable, page.getTotalElements()));
    }

    // ── Get single user ─────────────────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<UserSummary> getUser(@PathVariable Long id) {
        User caller = currentUserCtx.getCaller();
        User target = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        roleValidator.assertCanView(caller, target.getRole());
        return ResponseEntity.ok(UserSummary.from(target));
    }

    // ── Toggle enable / disable ─────────────────────────────────────────────
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<Map<String, Object>> toggleStatus(@PathVariable Long id) {
        User caller = currentUserCtx.getCaller();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        roleValidator.assertCanUpdate(caller, user);
        user.setEnabled(!user.isEnabled());
        userRepository.save(user);
        auditLogService.log(user.isEnabled() ? "USER_ENABLED" : "USER_DISABLED",
                "USER", user.getId(),
                String.format("%s toggled status of %s to %s",
                        caller.getEmail(), user.getEmail(), user.isEnabled()));
        return ResponseEntity.ok(Map.of("id", id, "enabled", user.isEnabled()));
    }

    // ── Reset password ──────────────────────────────────────────────────────
    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User caller = currentUserCtx.getCaller();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        roleValidator.assertCanUpdate(caller, user);
        String newPw = body.get("newPassword");
        if (newPw == null || newPw.length() < 6)
            throw new BadRequestException("New password must be at least 6 characters.");
        user.setPassword(passwordEncoder.encode(newPw));
        user.setFailedLoginAttempts(0);
        user.setAccountLocked(false);
        userRepository.save(user);
        auditLogService.log("USER_PASSWORD_RESET", "USER", user.getId(),
                String.format("%s reset password for %s", caller.getEmail(), user.getEmail()));
        log.info("[UserMgmt] Password reset for user {}", user.getEmail());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }

    // ── Delete user ─────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        User caller = currentUserCtx.getCaller();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        roleValidator.assertCanDelete(caller, user);

        String email = user.getEmail();
        User.Role role = user.getRole();

        // ── Route deletion through the correct service to handle all FK cascades ──
        // Teacher.user_id and Student.user_id are NOT NULL FKs — deleting the
        // User row directly would violate the constraint. The service methods
        // delete dependent records (Marks, AttendanceSessions, etc.) first.
        switch (role) {
            case HOD, TEACHER -> {
                Teacher teacher = teacherRepository.findByUserId(user.getId()).orElse(null);
                if (teacher != null) {
                    // Full cascade: Marks, TeacherAttendance, AttendanceSessions, Timetable, User+deps
                    teacherService.deleteTeacher(teacher.getId());
                } else {
                    // No profile row — just clean up User dependencies
                    userDeletionService.deleteUser(user);
                }
            }
            case STUDENT -> {
                Student student = studentRepository.findByUserId(user.getId()).orElse(null);
                if (student != null) {
                    // Full cascade: Marks, Attendance, Faces, User+deps
                    studentService.deleteStudent(student.getId());
                } else {
                    userDeletionService.deleteUser(user);
                }
            }
            default -> {
                // SUPER_ADMIN, ADMIN — no Teacher/Student profile, but still need
                // to clean up RefreshToken, Notification, AuditLog, AISession, AIQuery
                userDeletionService.deleteUser(user);
            }
        }

        auditLogService.log("USER_DELETED", "USER", id,
                String.format("%s deleted %s account (%s)",
                        caller.getEmail(), role, email));
        log.info("[UserMgmt] {} deleted {} ({})", caller.getEmail(), email, role);
        return ResponseEntity.ok(Map.of("message", "User deleted."));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────
    private String callerRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return "";
        return auth.getAuthorities().stream().findFirst()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .orElse("");
    }
    // validateCreationPermission() removed — replaced by RoleValidator.assertCanCreate()

    // ── Inner DTO ────────────────────────────────────────────────────────────
    public record UserSummary(Long id, String firstName, String lastName,
                               String email, String phone, User.Role role,
                               boolean enabled, boolean emailVerified) {
        static UserSummary from(User u) {
            return new UserSummary(u.getId(), u.getFirstName(), u.getLastName(),
                    u.getEmail(), u.getPhone(), u.getRole(), u.isEnabled(), u.isEmailVerified());
        }
    }
}
