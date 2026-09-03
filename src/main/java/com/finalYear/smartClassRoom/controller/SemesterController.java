package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.SemesterRequest;
import com.finalYear.smartClassRoom.dto.request.SemesterTimelineRequest;
import com.finalYear.smartClassRoom.dto.response.SemesterResponse;
import com.finalYear.smartClassRoom.service.SemesterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/semesters")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SemesterController {

    private final SemesterService semesterService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<SemesterResponse> createSemester(
            @Valid @RequestBody SemesterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(semesterService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<SemesterResponse> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterRequest request) {
        return ResponseEntity.ok(semesterService.update(id, request));
    }

    /**
     * PATCH /api/semesters/{id}/timeline
     * Updates ONLY the start/end dates of a semester.
     * If applyToAll=true in the request body, the same dates are applied to
     * the same semester number across ALL departments.
     */
    @PatchMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<?> updateTimeline(
            @PathVariable Long id,
            @RequestBody SemesterTimelineRequest req) {

        if (req.isApplyToAll()) {
            // First, load the semester to get its number
            SemesterResponse sem = semesterService.getById(id);
            int updated = semesterService.applyTimelineToAllDepts(
                    sem.getNumber(), req.getStartDate(), req.getEndDate());
            return ResponseEntity.ok(Map.of(
                    "message", "Timeline applied to " + updated + " department(s) for Semester " + sem.getNumber(),
                    "updatedCount", updated
            ));
        }

        SemesterResponse result = semesterService.updateTimeline(id, req.getStartDate(), req.getEndDate());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<SemesterResponse> getSemester(@PathVariable Long id) {
        return ResponseEntity.ok(semesterService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<SemesterResponse>> getAllSemesters() {
        return ResponseEntity.ok(semesterService.getAll());
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<SemesterResponse>> getDepartmentSemesters(
            @PathVariable Long departmentId) {
        return ResponseEntity.ok(semesterService.getByDepartment(departmentId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<String> deleteSemester(@PathVariable Long id) {
        semesterService.delete(id);
        return ResponseEntity.ok("Semester deleted successfully.");
    }
}