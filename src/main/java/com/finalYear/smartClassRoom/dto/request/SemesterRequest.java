package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SemesterRequest {

    @NotBlank(message = "Semester name is required")
    private String name;

    @NotNull(message = "Semester number is required")
    private Integer number;

    @NotNull(message = "Department is required")
    private Long departmentId;

    private LocalDate startDate;

    private LocalDate endDate;

    private boolean active = true;
}