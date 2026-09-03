package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.Holiday;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class HolidayRequest {

    @NotBlank(message = "Holiday name is required")
    private String name;

    @NotNull(message = "Holiday date is required")
    private LocalDate date;

    @NotNull(message = "Holiday type is required")
    private Holiday.HolidayType type;

    private String description;

    /** null = applies to all semesters; 1-8 = specific semester only */
    private Integer semesterNumber;
}
