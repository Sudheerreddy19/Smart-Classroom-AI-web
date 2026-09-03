package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentResponse {

    private Long id;

    private String name;

    private String code;

    private String description;

    private String hodName;

    private Integer totalTeachers;

    private Integer totalStudents;
    private Integer studentCount;
    private Integer teacherCount;
}