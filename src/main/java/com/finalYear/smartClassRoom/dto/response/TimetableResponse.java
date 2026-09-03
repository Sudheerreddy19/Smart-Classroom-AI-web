package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Timetable;
import lombok.*;

import java.time.LocalTime;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableResponse {

    private Long id;

    private Long subjectId;
    private String subjectName;

    private Long teacherId;
    private String teacherName;

    private Long classroomId;
    private String roomNumber;

    private Long semesterId;
    private String semesterName;

    private Long sectionId;
    private String sectionName;

    private Timetable.DayOfWeek dayOfWeek;

    private LocalTime startTime;

    private LocalTime endTime;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}