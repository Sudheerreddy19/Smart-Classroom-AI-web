package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubjectRequest {

    @NotBlank(message = "Subject name is required")
    private String name;

    @NotBlank(message = "Subject code is required")
    private String code;

    private String description;

    @Min(value = 1, message = "Credits must be at least 1")
    private Integer credits;

    @Min(value = 1, message = "Total hours must be at least 1")
    private Integer totalHours;

    @NotNull(message = "Semester is required")
    private Long semesterId;

    @NotNull(message = "Department is required")
    private Long departmentId;
}