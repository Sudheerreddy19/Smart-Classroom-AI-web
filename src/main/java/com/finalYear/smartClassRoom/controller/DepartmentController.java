package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.DepartmentRequest;
import com.finalYear.smartClassRoom.dto.response.DepartmentResponse;
import com.finalYear.smartClassRoom.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<DepartmentResponse> createDepartment(
            @Valid @RequestBody DepartmentRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(departmentService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DepartmentResponse> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request) {

        return ResponseEntity.ok(
                departmentService.update(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DepartmentResponse> getDepartment(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                departmentService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<DepartmentResponse>> getAllDepartments() {

        return ResponseEntity.ok(
                departmentService.getAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDepartment(
            @PathVariable Long id) {

        departmentService.delete(id);

        return ResponseEntity.ok("Department deleted successfully.");
    }
}