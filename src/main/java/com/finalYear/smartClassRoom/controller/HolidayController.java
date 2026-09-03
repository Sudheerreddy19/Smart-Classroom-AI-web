package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.HolidayRequest;
import com.finalYear.smartClassRoom.dto.response.HolidayResponse;
import com.finalYear.smartClassRoom.service.HolidayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/holidays")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HolidayController {

    private final HolidayService holidayService;

    /** All active holidays */
    @GetMapping
    public ResponseEntity<List<HolidayResponse>> getAll() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }

    /** Holidays applicable to a specific semester number (including global) */
    @GetMapping("/semester/{semesterNumber}")
    public ResponseEntity<List<HolidayResponse>> getBySemester(
            @PathVariable int semesterNumber) {
        return ResponseEntity.ok(holidayService.getHolidaysBySemester(semesterNumber));
    }

    /** Filter holidays by type (NATIONAL, PUBLIC, COLLEGE, EXAM, RESTRICTED) */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<HolidayResponse>> getByType(
            @PathVariable String type) {
        return ResponseEntity.ok(holidayService.getHolidaysByType(type));
    }

    /** Add a single holiday */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<HolidayResponse> addHoliday(
            @Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holidayService.addHoliday(request));
    }

    /** Update an existing holiday */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN','HOD')")
    public ResponseEntity<HolidayResponse> updateHoliday(
            @PathVariable Long id,
            @Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.ok(holidayService.updateHoliday(id, request));
    }

    /** Delete a holiday */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<String> deleteHoliday(@PathVariable Long id) {
        holidayService.deleteHoliday(id);
        return ResponseEntity.ok("Holiday deleted successfully.");
    }

    /** Bulk add holidays */
    @PostMapping("/bulk")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<List<HolidayResponse>> addBulk(
            @Valid @RequestBody List<HolidayRequest> requests) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(holidayService.addBulkHolidays(requests));
    }
}
