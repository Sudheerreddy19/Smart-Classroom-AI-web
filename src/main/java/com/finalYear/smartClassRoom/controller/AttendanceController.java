package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.AttendanceSessionRequest;
import com.finalYear.smartClassRoom.dto.request.FaceAttendanceRequest;
import com.finalYear.smartClassRoom.dto.request.MarkAttendanceRequest;
import com.finalYear.smartClassRoom.dto.response.AttendanceResponse;
import com.finalYear.smartClassRoom.dto.response.AttendanceSessionResponse;
import com.finalYear.smartClassRoom.dto.response.FaceAttendanceResult;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AttendanceController {

    private final AttendanceService attendanceService;


    @PostMapping("/session")
    public ResponseEntity<AttendanceSessionResponse> createSession(
            @Valid @RequestBody AttendanceSessionRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceService.createSession(request));
    }


    @PutMapping("/session/{sessionId}/close")
    public ResponseEntity<AttendanceSessionResponse> closeSession(
            @PathVariable Long sessionId) {

        return ResponseEntity.ok(
                attendanceService.closeSession(sessionId));
    }


    @PostMapping("/mark")
    public ResponseEntity<AttendanceResponse> markAttendance(
            @Valid @RequestBody MarkAttendanceRequest request) {

        return ResponseEntity.ok(
                attendanceService.markAttendance(request));
    }


    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<AttendanceResponse>> getSessionAttendance(
            @PathVariable Long sessionId) {

        return ResponseEntity.ok(
                attendanceService.getSessionAttendance(sessionId));
    }


    @GetMapping("/today")
    public ResponseEntity<List<AttendanceSessionResponse>> getTodaySessions(
            @AuthenticationPrincipal User caller) {

        return ResponseEntity.ok(
                attendanceService.getTodaySessions());
    }


    /**
     * POST /api/attendance/face-mark
     * Calls Python face-recognition service to identify a student from the webcam,
     * then marks them PRESENT in the given session.
     */
    @PostMapping("/face-mark")
    public ResponseEntity<FaceAttendanceResult> faceMarkAttendance(
            @Valid @RequestBody FaceAttendanceRequest request,
            @AuthenticationPrincipal User caller) {

        return ResponseEntity.ok(
                attendanceService.faceMarkAttendance(request, caller));
    }

    /**
     * POST /api/attendance/face-mark-multi
     * Detects ALL faces in the browser webcam frame and marks attendance
     * for every recognised student simultaneously.
     */
    @PostMapping("/face-mark-multi")
    public ResponseEntity<List<FaceAttendanceResult>> faceMarkAttendanceMulti(
            @Valid @RequestBody FaceAttendanceRequest request,
            @AuthenticationPrincipal User caller) {

        return ResponseEntity.ok(
                attendanceService.faceMarkAttendanceMulti(request, caller));
    }



    /**
     * GET /api/attendance/report?departmentId=X&semesterId=Y&subjectId=Z&from=YYYY-MM-DD&to=YYYY-MM-DD
     * Returns student-wise attendance percentage report.
     */
    @GetMapping("/report")
    public ResponseEntity<List<Map<String, Object>>> getAttendanceReport(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long semesterId,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        LocalDate dateFrom = from != null ? LocalDate.parse(from) : LocalDate.now().minusDays(30);
        LocalDate dateTo   = to   != null ? LocalDate.parse(to)   : LocalDate.now();

        return ResponseEntity.ok(
                attendanceService.getAttendanceReport(departmentId, semesterId, subjectId, dateFrom, dateTo));
    }


    /**
     * GET /api/attendance/sessions?departmentId=X&from=YYYY-MM-DD&to=YYYY-MM-DD
     * Returns all sessions with present/absent counts for the report page.
     */
    @GetMapping("/sessions")
    public ResponseEntity<List<AttendanceSessionResponse>> getSessions(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        LocalDate dateFrom = from != null ? LocalDate.parse(from) : LocalDate.now().minusDays(30);
        LocalDate dateTo   = to   != null ? LocalDate.parse(to)   : LocalDate.now();

        return ResponseEntity.ok(
                attendanceService.getSessionsInRange(departmentId, dateFrom, dateTo));
    }
}