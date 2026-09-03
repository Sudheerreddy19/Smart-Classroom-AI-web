package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubjectResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private Integer credits;

    private Integer totalHours;

    private Long semesterId;

    private String semesterName;

    private Long departmentId;

    private String departmentName;

    private Integer totalClasses;

    private Integer totalStudents;
}