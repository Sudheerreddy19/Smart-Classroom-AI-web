package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Student;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {

    private Long id;

    private Long userId;

    private String email;

    private String rollNumber;

    private String firstName;

    private String lastName;

    private Long departmentId;

    private String departmentName;

    private Long semesterId;

    private String semesterName;

    private Long sectionId;

    private String sectionName;

    private Long classroomId;

    private String classroomName;   // e.g. CSE-A

    private LocalDate dateOfBirth;

    private String phone;

    private String address;

    private String guardianName;

    private String guardianPhone;

    private String profileImage;

    private String admissionNumber;

    private String officialEmail;

    private String branch;

    private String academicYear;

    private Student.RegistrationStatus registrationStatus;

    private boolean active;

    private LocalDateTime createdAt;
}