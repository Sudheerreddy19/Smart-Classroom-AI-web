package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.Attendance;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MarkAttendanceRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Attendance status is required")
    private Attendance.AttendanceStatus status;

    private Attendance.MarkingMethod method;

    private Double confidenceScore;
}