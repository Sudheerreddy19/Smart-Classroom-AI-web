package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @Email(message = "Invalid email")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must contain at least 6 characters")
    private String password;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String phone;

    // Used by staff creation endpoints (UserManagementController).
    // Public /api/auth/register ignores this and always forces STUDENT in AuthServiceImpl.
    private User.Role role;

    // Department that this user belongs to.
    // Mandatory for STUDENT self-registration and staff creation via UserManagementController.
    private Long departmentId;
}