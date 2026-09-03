package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.BadRequestException;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Central service for resolving the currently authenticated user's
 * role and department. Injected by all list/query services to enforce
 * role-based + department-based data isolation.
 *
 * Usage pattern in every service:
 *   Long effectiveDeptId = currentUserCtx.resolveEffectiveDepartmentId(requestedDeptId);
 *   if (effectiveDeptId != null) → filter by dept; else → return all
 */
@Service
@RequiredArgsConstructor
public class CurrentUserContextService {

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    /** Returns the currently authenticated User entity (Spring Security principal). */
    public User getCaller() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof User)) {
            throw new AccessDeniedException("Not authenticated");
        }
        return (User) auth.getPrincipal();
    }

    /** Shorthand for getCaller().getRole(). */
    public User.Role getCallerRole() {
        return getCaller().getRole();
    }

    /**
     * Resolves the department ID of the caller.
     * Returns null for SUPER_ADMIN / ADMIN (they span all departments).
     * Returns the dept ID from the Teacher/Student profile for HOD/TEACHER/STUDENT.
     */
    public Long getCallerDepartmentId() {
        User caller = getCaller();
        return switch (caller.getRole()) {
            case HOD, TEACHER -> teacherRepository.findByUserId(caller.getId())
                    .map(t -> t.getDepartment() != null ? t.getDepartment().getId() : null)
                    .orElse(null);
            case STUDENT -> studentRepository.findByUserId(caller.getId())
                    .map(s -> s.getDepartment() != null ? s.getDepartment().getId() : null)
                    .orElse(null);
            default -> null; // SUPER_ADMIN, ADMIN — unrestricted
        };
    }

    /**
     * Returns the effective department ID to use for DB filtering.
     *
     * Rules:
     *  - SUPER_ADMIN / ADMIN: returns requestedDeptId (null = show all, non-null = filter by it)
     *  - HOD / TEACHER / STUDENT: always returns their own dept ID, ignores requestedDeptId
     *
     * Throws BadRequestException if HOD/TEACHER/STUDENT has no department assigned.
     */
    public Long resolveEffectiveDepartmentId(Long requestedDeptId) {
        User.Role role = getCallerRole();

        // Privileged roles: honour the requested filter (or null = no filter)
        if (role == User.Role.SUPER_ADMIN || role == User.Role.ADMIN) {
            return requestedDeptId;
        }

        // Restricted roles: always use own department regardless of what was requested
        Long myDeptId = getCallerDepartmentId();
        if (myDeptId == null) {
            throw new BadRequestException(
                    "Your account (" + role + ") is not assigned to any department. " +
                    "Please contact your administrator.");
        }
        return myDeptId;
    }

    /**
     * Throws 403 if a HOD/TEACHER tries to modify a resource that belongs
     * to a different department.  SUPER_ADMIN/ADMIN always pass.
     */
    public void assertDepartmentAccess(Long resourceDeptId) {
        User.Role role = getCallerRole();
        if (role == User.Role.SUPER_ADMIN || role == User.Role.ADMIN) return;

        Long myDeptId = getCallerDepartmentId();
        if (myDeptId == null || !myDeptId.equals(resourceDeptId)) {
            throw new AccessDeniedException(
                    "You can only manage resources within your own department.");
        }
    }
}
