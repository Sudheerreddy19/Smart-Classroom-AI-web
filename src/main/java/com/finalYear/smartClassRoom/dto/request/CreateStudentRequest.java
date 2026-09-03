package com.finalYear.smartClassRoom.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStudentRequest {

    private String firstName;

    private String lastName;

    private String email;

    private String password;

    private String phone;

    private Long departmentId;

    private Long semesterId;

    private String section;

    private String rollNumber;
}