package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.Timetable;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableRequest {

    @NotNull
    private Long subjectId;

    @NotNull
    private Long teacherId;

    @NotNull
    private Long classroomId;

    @NotNull
    private Long semesterId;

    /** Optional — links this slot to a specific section (e.g. Section A vs B) */
    private Long sectionId;

    @NotNull
    private Timetable.DayOfWeek dayOfWeek;

    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;
}