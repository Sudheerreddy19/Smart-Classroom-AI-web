package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeacherResponse {

    private Long id;

    private Long userId;

    private String email;

    private String employeeId;

    private String firstName;

    private String lastName;

    private String designation;

    private String specialization;

    private String phone;

    private Long departmentId;

    private String departmentName;

    private String faceEncodingPath;

    private String profileImage;

    private boolean active;

    private LocalDateTime createdAt;
}