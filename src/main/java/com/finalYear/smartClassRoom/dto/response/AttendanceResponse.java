package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Attendance;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {

    private Long id;

    private Long sessionId;

    private Long studentId;

    private String studentName;

    private String rollNumber;

    private Attendance.AttendanceStatus status;

    private Attendance.MarkingMethod method;

    private Double confidenceScore;

    private LocalDateTime markedAt;
}