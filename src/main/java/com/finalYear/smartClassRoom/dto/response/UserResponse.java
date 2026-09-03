package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.User;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private User.Role role;

    private Boolean enabled;

    private Boolean accountLocked;

    private Boolean emailVerified;

    private LocalDateTime lastLogin;

    private LocalDateTime createdAt;

    private Long createdBy;

}