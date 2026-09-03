package com.finalYear.smartClassRoom.security;

import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.BadRequestException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Centralized Role-Based Access Control (RBAC) validator.
 *
 * ALL permission decisions for CREATE / UPDATE / DELETE / VIEW must go through
 * this class. Controllers and services must NOT contain inline role-if logic.
 *
 * Hierarchy (top → bottom):
 *   SUPER_ADMIN > ADMIN > HOD > TEACHER > STUDENT
 *
 * Throws:
 *   AccessDeniedException (→ HTTP 403) when the caller lacks permission.
 *   BadRequestException   (→ HTTP 400) for self-deletion or invalid state.
 */
@Component
public class RoleValidator {

    // ── Boolean helpers (used by existing code) ────────────────────────────

    /**
     * Returns true if the creator role can create an account with targetRole.
     * CREATE matrix:
     *   SUPER_ADMIN → ADMIN, HOD, TEACHER, STUDENT
     *   ADMIN       → HOD, TEACHER, STUDENT
     *   HOD         → TEACHER, STUDENT
     *   TEACHER     → STUDENT
     *   STUDENT     → NONE
     */
    public boolean canCreate(User.Role creator, User.Role target) {
        return switch (creator) {
            case SUPER_ADMIN -> target == User.Role.ADMIN
                    || target == User.Role.HOD
                    || target == User.Role.TEACHER
                    || target == User.Role.STUDENT;
            case ADMIN       -> target == User.Role.HOD
                    || target == User.Role.TEACHER
                    || target == User.Role.STUDENT;
            case HOD         -> target == User.Role.TEACHER
                    || target == User.Role.STUDENT;
            case TEACHER     -> target == User.Role.STUDENT;
            default          -> false;
        };
    }

    /**
     * Returns true if the manager role can manage (update/delete/view) the target role.
     * MANAGE matrix (same bounds as CREATE):
     *   SUPER_ADMIN → everyone except another SUPER_ADMIN
     *   ADMIN       → HOD, TEACHER, STUDENT
     *   HOD         → TEACHER, STUDENT
     *   TEACHER     → STUDENT
     *   STUDENT     → NONE
     */
    public boolean canManage(User.Role manager, User.Role target) {
        return switch (manager) {
            case SUPER_ADMIN -> target != User.Role.SUPER_ADMIN;
            case ADMIN       -> target == User.Role.HOD
                    || target == User.Role.TEACHER
                    || target == User.Role.STUDENT;
            case HOD         -> target == User.Role.TEACHER
                    || target == User.Role.STUDENT;
            case TEACHER     -> target == User.Role.STUDENT;
            default          -> false;
        };
    }

    // ── Enforcing helpers (throw on failure — Phase 3) ────────────────────

    /**
     * Asserts the caller can create an account with targetRole.
     * Throws AccessDeniedException (403) if not allowed.
     */
    public void assertCanCreate(User caller, User.Role targetRole) {
        if (targetRole == null)
            throw new BadRequestException("Target role must not be null.");
        if (!canCreate(caller.getRole(), targetRole))
            throw new AccessDeniedException(
                String.format("Role %s is not permitted to create %s accounts.",
                    caller.getRole(), targetRole));
    }

    /**
     * Asserts the caller can update the target user.
     * Self-update is always permitted (profile editing).
     * Throws AccessDeniedException (403) if not allowed.
     */
    public void assertCanUpdate(User caller, User target) {
        // Self-update always allowed
        if (caller.getId() != null && caller.getId().equals(target.getId())) return;
        if (!canManage(caller.getRole(), target.getRole()))
            throw new AccessDeniedException(
                String.format("Role %s is not permitted to update %s accounts.",
                    caller.getRole(), target.getRole()));
    }

    /**
     * Asserts the caller can delete the target user.
     * Prevents self-deletion for all roles.
     * Throws BadRequestException (400) for self-deletion.
     * Throws AccessDeniedException (403) if not allowed.
     */
    public void assertCanDelete(User caller, User target) {
        if (caller.getId() != null && caller.getId().equals(target.getId()))
            throw new BadRequestException("You cannot delete your own account.");
        if (!canManage(caller.getRole(), target.getRole()))
            throw new AccessDeniedException(
                String.format("Role %s is not permitted to delete %s accounts.",
                    caller.getRole(), target.getRole()));
    }

    /**
     * Asserts the caller can view a resource belonging to the given role.
     * Throws AccessDeniedException (403) if not allowed.
     */
    public void assertCanView(User caller, User.Role targetRole) {
        if (caller.getRole() == User.Role.SUPER_ADMIN) return; // full access
        if (!canManage(caller.getRole(), targetRole))
            throw new AccessDeniedException(
                String.format("Role %s is not permitted to view %s data.",
                    caller.getRole(), targetRole));
    }
}