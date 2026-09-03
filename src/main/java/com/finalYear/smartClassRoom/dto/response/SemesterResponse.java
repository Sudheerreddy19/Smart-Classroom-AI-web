package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterResponse {

    private Long id;

    private String name;

    private Integer number;

    private Long departmentId;

    private String departmentName;

    private LocalDate startDate;

    private LocalDate endDate;

    private boolean active;

    private Integer totalSubjects;

    private Integer totalStudents;
}