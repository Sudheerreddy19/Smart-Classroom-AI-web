package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSelfRegisterRequest {
    @NotBlank
    private String rollNumber;
    
    @NotNull
    private LocalDate dateOfBirth;
    
    @NotBlank
    @Pattern(regexp="[0-9]{10}")
    private String mobile;
    
    @NotBlank
    @Email
    private String personalEmail;
    
    @NotBlank
    @Size(min=8)
    private String password;
    
    @NotBlank
    private String confirmPassword;
}
