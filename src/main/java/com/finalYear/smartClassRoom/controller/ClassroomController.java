package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.ClassroomRequest;
import com.finalYear.smartClassRoom.dto.response.ClassroomResponse;
import com.finalYear.smartClassRoom.service.ClassroomService;
import com.finalYear.smartClassRoom.service.impl.ClassroomAutoAssignService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/classrooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ClassroomController {

    private final ClassroomService classroomService;
    private final ClassroomAutoAssignService classroomAutoAssignService;


    @PostMapping
    public ResponseEntity<ClassroomResponse> createClassroom(
            @Valid @RequestBody ClassroomRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClassroomResponse> updateClassroom(
            @PathVariable Long id,
            @Valid @RequestBody ClassroomRequest request) {

        return ResponseEntity.ok(classroomService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClassroomResponse> getClassroom(
            @PathVariable Long id) {

        return ResponseEntity.ok(classroomService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<ClassroomResponse>> getAllClassrooms() {

        return ResponseEntity.ok(classroomService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteClassroom(@PathVariable Long id) {
        classroomService.delete(id);
        return ResponseEntity.ok("Classroom deleted successfully.");
    }

    /**
     * GET /api/classrooms/capacity-report
     * Returns fill stats for all auto-named classrooms (CSE-A, ECE-B …)
     */
    @GetMapping("/capacity-report")
    public ResponseEntity<List<ClassroomAutoAssignService.ClassroomCapacityEntry>> capacityReport() {
        return ResponseEntity.ok(classroomAutoAssignService.getCapacityReport());
    }

    /**
     * POST /api/classrooms/adjust-capacity?deptCode=CSE
     * Calculates avg students per room and sets all rooms for that dept to that capacity
     */
    @PostMapping("/adjust-capacity")
    public ResponseEntity<String> adjustCapacity(@RequestParam String deptCode) {
        return ResponseEntity.ok(classroomAutoAssignService.adjustCapacity(deptCode));
    }
}