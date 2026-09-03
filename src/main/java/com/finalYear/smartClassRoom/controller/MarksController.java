package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.MarksRequest;
import com.finalYear.smartClassRoom.dto.response.MarksResponse;
import com.finalYear.smartClassRoom.service.MarksService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarksController {

    private final MarksService marksService;

    @PostMapping
    public ResponseEntity<MarksResponse> addMarks(
            @Valid @RequestBody MarksRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(marksService.addMarks(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MarksResponse> updateMarks(
            @PathVariable Long id,
            @Valid @RequestBody MarksRequest request) {

        return ResponseEntity.ok(
                marksService.updateMarks(id, request));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<MarksResponse>> getStudentMarks(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(
                marksService.getStudentMarks(studentId));
    }

    @GetMapping("/student/{studentId}/semester/{semesterId}")
    public ResponseEntity<List<MarksResponse>> getStudentMarksBySemester(
            @PathVariable Long studentId,
            @PathVariable Long semesterId) {

        return ResponseEntity.ok(
                marksService.getStudentMarksBySemester(studentId, semesterId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteMarks(
            @PathVariable Long id) {

        marksService.deleteMarks(id);

        return ResponseEntity.ok("Marks deleted successfully.");
    }
}