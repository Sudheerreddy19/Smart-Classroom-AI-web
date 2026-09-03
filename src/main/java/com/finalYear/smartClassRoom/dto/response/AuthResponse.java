package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long userId;

    private String email;

    private String firstName;

    private String lastName;

    private User.Role role;

    private String dashboardUrl;
}