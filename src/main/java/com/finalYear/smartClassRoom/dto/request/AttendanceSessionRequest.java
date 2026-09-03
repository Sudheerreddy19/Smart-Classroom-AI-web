package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceSessionRequest {

    private Long timetableId;

    @NotNull(message = "Classroom is required")
    private Long classroomId;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Teacher is required")
    private Long teacherId;

    @NotNull(message = "Session date is required")
    private LocalDate sessionDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;
}