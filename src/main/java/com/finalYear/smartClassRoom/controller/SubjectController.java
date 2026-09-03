package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.SubjectRequest;
import com.finalYear.smartClassRoom.dto.response.SubjectResponse;
import com.finalYear.smartClassRoom.service.SubjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SubjectController {

    private final SubjectService subjectService;

    @PostMapping
    public ResponseEntity<SubjectResponse> createSubject(
            @Valid @RequestBody SubjectRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(subjectService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SubjectResponse> updateSubject(
            @PathVariable Long id,
            @Valid @RequestBody SubjectRequest request) {

        return ResponseEntity.ok(subjectService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubjectResponse> getSubject(
            @PathVariable Long id) {

        return ResponseEntity.ok(subjectService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<SubjectResponse>> getAllSubjects() {

        return ResponseEntity.ok(subjectService.getAll());
    }

    @GetMapping("/semester/{semesterId}")
    public ResponseEntity<List<SubjectResponse>> getSubjectsBySemester(
            @PathVariable Long semesterId) {

        return ResponseEntity.ok(subjectService.getBySemester(semesterId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSubject(
            @PathVariable Long id) {

        subjectService.delete(id);

        return ResponseEntity.ok("Subject deleted successfully.");
    }
}