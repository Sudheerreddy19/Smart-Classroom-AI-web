package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.TeacherRequest;
import com.finalYear.smartClassRoom.dto.response.TeacherResponse;
import com.finalYear.smartClassRoom.entity.Teacher;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.TeacherRepository;
import com.finalYear.smartClassRoom.security.RoleValidator;
import com.finalYear.smartClassRoom.service.AuditLogService;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TeacherController {

    private final TeacherService           teacherService;
    private final TeacherRepository        teacherRepository;
    private final RoleValidator            roleValidator;
    private final AuditLogService          auditLogService;
    private final CurrentUserContextService currentUserCtx;

    // ── Create ────────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<TeacherResponse> createTeacher(
            @Valid @RequestBody TeacherRequest request,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanCreate(caller, User.Role.TEACHER);
        TeacherResponse created = teacherService.createTeacher(request);
        auditLogService.log("TEACHER_CREATED", "TEACHER", created.getId(),
                String.format("%s created teacher %s %s",
                        caller.getEmail(), created.getFirstName(), created.getLastName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<TeacherResponse> updateTeacher(
            @PathVariable Long id,
            @Valid @RequestBody TeacherRequest request,
            @AuthenticationPrincipal User caller) {

        // Resolve target user from teacher profile
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        roleValidator.assertCanUpdate(caller, teacher.getUser());

        TeacherResponse updated = teacherService.updateTeacher(id, request);
        auditLogService.log("TEACHER_UPDATED", "TEACHER", id,
                String.format("%s updated teacher id=%d", caller.getEmail(), id));
        return ResponseEntity.ok(updated);
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponse> getTeacher(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanView(caller, User.Role.TEACHER);
        return ResponseEntity.ok(teacherService.getTeacherById(id));
    }

    // ── List (dept-filtered, Phase 2 preserved) ───────────────────────────────
    /**
     * GET /api/teachers
     * Optional query param: ?departmentId=X
     * — For SUPER_ADMIN/ADMIN: filters by dept if provided, returns all if not.
     * — For HOD/TEACHER: always returns only their own dept (param is ignored server-side).
     */
    @GetMapping
    public ResponseEntity<Page<TeacherResponse>> getAllTeachers(
            @RequestParam(required = false) Long departmentId,
            Pageable pageable,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanView(caller, User.Role.TEACHER);
        return ResponseEntity.ok(teacherService.getAllTeachers(pageable, departmentId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteTeacher(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {

        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        roleValidator.assertCanDelete(caller, teacher.getUser());
        teacherService.deleteTeacher(id);
        auditLogService.log("TEACHER_DELETED", "TEACHER", id,
                String.format("%s deleted teacher id=%d", caller.getEmail(), id));
        return ResponseEntity.ok("Teacher deleted successfully.");
    }
}