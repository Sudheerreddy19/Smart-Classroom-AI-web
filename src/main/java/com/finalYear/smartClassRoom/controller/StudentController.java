package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.StudentRequest;
import com.finalYear.smartClassRoom.dto.response.StudentResponse;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.security.RoleValidator;
import com.finalYear.smartClassRoom.service.AuditLogService;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService            studentService;
    private final StudentRepository         studentRepository;
    private final RoleValidator             roleValidator;
    private final AuditLogService           auditLogService;
    private final CurrentUserContextService currentUserCtx;

    // ── Create ────────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(
            @Valid @RequestBody StudentRequest request,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanCreate(caller, User.Role.STUDENT);
        StudentResponse created = studentService.createStudent(request);
        auditLogService.log("STUDENT_CREATED", "STUDENT", created.getId(),
                String.format("%s created student %s %s",
                        caller.getEmail(), created.getFirstName(), created.getLastName()));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── Update ────────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> updateStudent(
            @PathVariable Long id,
            @Valid @RequestBody StudentRequest request,
            @AuthenticationPrincipal User caller) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        roleValidator.assertCanUpdate(caller, student.getUser());

        StudentResponse updated = studentService.updateStudent(id, request);
        auditLogService.log("STUDENT_UPDATED", "STUDENT", id,
                String.format("%s updated student id=%d", caller.getEmail(), id));
        return ResponseEntity.ok(updated);
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudent(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {

        // Students may view their own profile; others need STUDENT-view permission
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        boolean isSelf = student.getUser() != null
                && student.getUser().getId().equals(caller.getId());
        if (!isSelf) {
            roleValidator.assertCanView(caller, User.Role.STUDENT);
        }
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    // ── Get by Roll Number ────────────────────────────────────────────────────
    @GetMapping("/roll/{rollNumber}")
    public ResponseEntity<StudentResponse> getStudentByRoll(
            @PathVariable String rollNumber,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanView(caller, User.Role.STUDENT);
        return ResponseEntity.ok(studentService.getStudentByRollNumber(rollNumber));
    }

    // ── List (dept-filtered, Phase 2 preserved) ───────────────────────────────
    /**
     * GET /api/students
     * Optional query param: ?departmentId=X
     * — For SUPER_ADMIN/ADMIN: filters by dept if provided, returns all if not.
     * — For HOD/TEACHER: always returns only their own dept (param ignored server-side).
     */
    @GetMapping
    public ResponseEntity<Page<StudentResponse>> getAllStudents(
            @RequestParam(required = false) Long departmentId,
            Pageable pageable,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanView(caller, User.Role.STUDENT);
        return ResponseEntity.ok(studentService.getAllStudents(pageable, departmentId));
    }

    // ── Get by Dept + Semester ────────────────────────────────────────────────
    @GetMapping("/department/{departmentId}/semester/{semesterId}")
    public ResponseEntity<List<StudentResponse>> getStudents(
            @PathVariable Long departmentId,
            @PathVariable Long semesterId,
            @AuthenticationPrincipal User caller) {

        roleValidator.assertCanView(caller, User.Role.STUDENT);
        return ResponseEntity.ok(
                studentService.getStudentsByDepartmentAndSemester(departmentId, semesterId));
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteStudent(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        roleValidator.assertCanDelete(caller, student.getUser());
        studentService.deleteStudent(id);
        auditLogService.log("STUDENT_DELETED", "STUDENT", id,
                String.format("%s deleted student id=%d", caller.getEmail(), id));
        return ResponseEntity.ok("Student deleted successfully.");
    }

    // ── Promote single student to next semester ──────────────────────────────
    /**
     * PUT /api/students/{id}/promote
     * Promotes the student to the next semester.
     * If in Sem 8, marks as graduated (active = false).
     * Accessible by HOD, ADMIN, SUPER_ADMIN.
     */
    @PutMapping("/{id}/promote")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<Map<String, Object>> promoteStudent(
            @PathVariable Long id,
            @AuthenticationPrincipal User caller) {

        Map<String, Object> result = studentService.promoteStudent(id);
        auditLogService.log("STUDENT_PROMOTED", "STUDENT", id,
                String.format("%s promoted student id=%d: %s",
                        caller.getEmail(), id, result.get("status")));
        return ResponseEntity.ok(result);
    }

    // ── Bulk promote all students in a dept+semester ────────────────────────
    /**
     * PUT /api/students/promote-batch?departmentId=X&semesterId=Y
     * Promotes ALL active students in the given dept+semester.
     * Returns { total, promoted, graduated, message }.
     * Accessible by HOD, ADMIN, SUPER_ADMIN.
     */
    @PutMapping("/promote-batch")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<Map<String, Object>> promoteStudentsBatch(
            @RequestParam Long departmentId,
            @RequestParam Long semesterId,
            @AuthenticationPrincipal User caller) {

        Map<String, Object> result = studentService.promoteStudentsBatch(
                departmentId, semesterId);
        auditLogService.log("STUDENTS_BATCH_PROMOTED", "STUDENT", null,
                String.format("%s batch-promoted dept=%d sem=%d: %s",
                        caller.getEmail(), departmentId, semesterId,
                        result.get("message")));
        return ResponseEntity.ok(result);
    }

    /**
     * PATCH /api/students/{id}/assign-section
     * Assigns a student to a section. Body: { "sectionId": 5 }
     */
    @PatchMapping("/{id}/assign-section")
    @org.springframework.security.access.prepost.PreAuthorize(
            "hasAnyRole('SUPER_ADMIN','ADMIN','HOD','TEACHER')")
    public ResponseEntity<Map<String, Object>> assignSection(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body,
            @AuthenticationPrincipal User caller) {

        Map<String, Object> result = studentService.assignSection(id, body.get("sectionId"));
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/students/by-section/{sectionId}
     * Returns all students in a given section.
     */
    @GetMapping("/by-section/{sectionId}")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getBySection(@PathVariable Long sectionId) {
        return ResponseEntity.ok(studentService.getStudentsBySection(sectionId));
    }
}