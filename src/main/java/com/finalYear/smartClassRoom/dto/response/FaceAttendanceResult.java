package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Attendance;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class FaceAttendanceResult {
    private boolean success;
    private String code;            // MARKED, DUPLICATE, NO_FACE, MULTIPLE_FACES, UNKNOWN
    private String message;
    private String studentId;       // roll number recognised by Python
    private String studentName;
    private Long   dbStudentId;     // Spring Boot student PK (if found)
    private Attendance.AttendanceStatus status;
    private Double confidence;
    private LocalDateTime markedAt;
}
