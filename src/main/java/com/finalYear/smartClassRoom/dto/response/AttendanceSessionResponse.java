package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.AttendanceSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSessionResponse {

    private Long id;
    private Long classroomId;
    private String roomNumber;
    private Long subjectId;
    private String subjectName;
    private Long teacherId;
    private String teacherName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AttendanceSession.SessionStatus status;
    private Integer totalStudents;
    private Integer presentCount;
    private Integer absentCount;
    private Double attendancePercentage;
    private Double averageAttendanceRate;

    private LocalDateTime createdAt;
}