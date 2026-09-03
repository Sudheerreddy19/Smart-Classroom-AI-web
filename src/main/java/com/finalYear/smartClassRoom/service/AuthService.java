package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.LoginRequest;
import com.finalYear.smartClassRoom.dto.request.RefreshTokenRequest;
import com.finalYear.smartClassRoom.dto.request.RegisterRequest;
import com.finalYear.smartClassRoom.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse login(LoginRequest request);

    AuthResponse register(RegisterRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);

    void logout(String refreshToken);

    void changePassword(String email, String oldPassword, String newPassword);
}