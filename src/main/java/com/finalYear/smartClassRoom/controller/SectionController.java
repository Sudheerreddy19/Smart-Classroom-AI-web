package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.entity.Section;
import com.finalYear.smartClassRoom.repository.SectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sections")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SectionController {

    private final SectionRepository sectionRepository;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Section>> getSections(
            @RequestParam Long departmentId,
            @RequestParam Long semesterId) {
        // Here we ideally return a DTO instead of the entity directly
        return ResponseEntity.ok(sectionRepository.findByDepartment_IdAndSemester_Id(departmentId, semesterId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HOD')")
    public ResponseEntity<Section> createSection(@RequestBody Section section) {
        // Implementation for creating section
        return ResponseEntity.ok(sectionRepository.save(section));
    }
}
