package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.SemesterDateUpdateRequest;
import com.finalYear.smartClassRoom.dto.response.AcademicCalendarResponse;
import com.finalYear.smartClassRoom.service.AcademicCalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/academic-calendar")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademicCalendarController {

    private final AcademicCalendarService calendarService;

    /** All semesters calendar (optionally filtered by department) */
    @GetMapping
    public ResponseEntity<List<AcademicCalendarResponse>> getAll(
            @RequestParam(required = false) Long departmentId) {
        return ResponseEntity.ok(calendarService.getAllCalendars(departmentId));
    }

    /** Single semester calendar detail */
    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<AcademicCalendarResponse> getBySemester(
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(calendarService.getCalendarBySemester(semesterId));
    }

    /** Calendar by semester number within a department */
    @GetMapping("/department/{departmentId}/semester-number/{number}")
    public ResponseEntity<AcademicCalendarResponse> getBySemesterNumber(
            @PathVariable Long departmentId,
            @PathVariable int number) {
        return ResponseEntity.ok(calendarService.getCalendarBySemesterNumber(departmentId, number));
    }

    /** Currently active semester calendar for a department */
    @GetMapping("/department/{departmentId}/current")
    public ResponseEntity<AcademicCalendarResponse> getCurrentSemester(
            @PathVariable Long departmentId) {
        return ResponseEntity.ok(calendarService.getCurrentSemesterCalendar(departmentId));
    }

    /** Update semester start/end dates — triggers auto-recalculation */
    @PutMapping("/semester/{semesterId}/dates")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<AcademicCalendarResponse> updateDates(
            @PathVariable Long semesterId,
            @Valid @RequestBody SemesterDateUpdateRequest request) {
        return ResponseEntity.ok(calendarService.updateSemesterDates(semesterId, request));
    }

    /** Force recalculate working days for a semester */
    @PostMapping("/semester/{semesterId}/recalculate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<AcademicCalendarResponse> recalculate(
            @PathVariable Long semesterId) {
        return ResponseEntity.ok(calendarService.recalculate(semesterId));
    }

    /** Working-day attendance % for a student in a semester */
    @GetMapping("/attendance-percentage")
    public ResponseEntity<Map<String, Object>> getAttendancePercentage(
            @RequestParam Long studentId,
            @RequestParam Long semesterId) {
        double pct = calendarService.getWorkingDayAttendancePercentage(studentId, semesterId);
        return ResponseEntity.ok(Map.of(
                "studentId",   studentId,
                "semesterId",  semesterId,
                "percentage",  pct,
                "basis",       "working-days-only"
        ));
    }
}
