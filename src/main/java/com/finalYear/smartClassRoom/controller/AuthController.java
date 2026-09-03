package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.LoginRequest;
import com.finalYear.smartClassRoom.dto.request.RefreshTokenRequest;
import com.finalYear.smartClassRoom.dto.request.RegisterRequest;
import com.finalYear.smartClassRoom.dto.request.StudentSelfRegisterRequest;
import com.finalYear.smartClassRoom.dto.response.AuthResponse;
import com.finalYear.smartClassRoom.service.AuthService;
import com.finalYear.smartClassRoom.service.StudentSelfRegisterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;
    private final StudentSelfRegisterService studentSelfRegisterService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request));
    }

    @PostMapping("/student-verify")
    public ResponseEntity<Map<String, Object>> studentVerify(
            @RequestBody Map<String, String> body) {

        return ResponseEntity.ok(studentSelfRegisterService.verifyIdentity(
                body.get("rollNumber"),
                body.get("dateOfBirth")));
    }

    @PostMapping("/student-register")
    public ResponseEntity<AuthResponse> studentRegister(
            @Valid @RequestBody StudentSelfRegisterRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentSelfRegisterService.selfRegister(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestParam String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.ok("Logged out successfully.");
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, String> body) {
        authService.changePassword(
                userDetails.getUsername(),
                body.get("oldPassword"),
                body.get("newPassword"));
        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }
}