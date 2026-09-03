package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Holiday;
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
public class HolidayResponse {

    private Long id;
    private String name;
    private LocalDate date;
    private String dayOfWeek;
    private Holiday.HolidayType type;
    private String typeLabel;
    private String description;
    private Integer semesterNumber;
    private boolean active;
    private LocalDateTime createdAt;
}
