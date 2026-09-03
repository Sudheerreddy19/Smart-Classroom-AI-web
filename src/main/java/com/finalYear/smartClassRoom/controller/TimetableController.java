package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.TimetableRequest;
import com.finalYear.smartClassRoom.dto.response.TimetableResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.service.TimetableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timetables")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TimetableController {

    private final TimetableService timetableService;

    @PostMapping
    public ResponseEntity<TimetableResponse> create(
            @Valid @RequestBody TimetableRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(timetableService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TimetableResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TimetableRequest request) {

        return ResponseEntity.ok(timetableService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimetableResponse> getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(timetableService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<TimetableResponse>> getAll(
            @AuthenticationPrincipal User caller) {

        return ResponseEntity.ok(timetableService.getAll());
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<TimetableResponse>> getByTeacher(
            @PathVariable Long teacherId) {

        return ResponseEntity.ok(
                timetableService.getByTeacher(teacherId));
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<TimetableResponse>> getByClassroom(
            @PathVariable Long classroomId) {

        return ResponseEntity.ok(
                timetableService.getByClassroom(classroomId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        timetableService.delete(id);
        return ResponseEntity.ok("Timetable deleted successfully.");
    }

    /** POST /api/timetables/bulk — save all slots from builder wizard in one shot */
    @PostMapping("/bulk")
    public ResponseEntity<List<TimetableResponse>> bulkCreate(
            @RequestBody List<TimetableRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(timetableService.bulkCreate(requests));
    }

    /** GET /api/timetables/section/{sectionId} — full week grid for a section */
    @GetMapping("/section/{sectionId}")
    public ResponseEntity<List<TimetableResponse>> getBySection(
            @PathVariable Long sectionId) {
        return ResponseEntity.ok(timetableService.getBySection(sectionId));
    }

    /** DELETE /api/timetables/section/{sectionId} — clear section timetable before rebuild */
    @DeleteMapping("/section/{sectionId}")
    public ResponseEntity<String> deleteBySection(@PathVariable Long sectionId) {
        timetableService.deleteBySection(sectionId);
        return ResponseEntity.ok("Section timetable cleared.");
    }
}