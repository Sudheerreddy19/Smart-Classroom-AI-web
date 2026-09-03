package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.response.DashboardResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardResponse> getDashboardStats(
            @AuthenticationPrincipal User caller) {

        return ResponseEntity.ok(
                dashboardService.getDashboardStats());
    }
}