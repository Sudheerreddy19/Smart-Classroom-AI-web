package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.SemesterDateUpdateRequest;
import com.finalYear.smartClassRoom.dto.response.AcademicCalendarResponse;

import java.util.List;

public interface AcademicCalendarService {

    /** Get calendar info for all semesters (grouped by department) */
    List<AcademicCalendarResponse> getAllCalendars(Long departmentId);

    /** Get calendar for a specific semester record */
    AcademicCalendarResponse getCalendarBySemester(Long semesterId);

    /** Get calendar info for a specific semester number (1–8) within a department */
    AcademicCalendarResponse getCalendarBySemesterNumber(Long departmentId, int semesterNumber);

    /** Get the currently active semester calendar */
    AcademicCalendarResponse getCurrentSemesterCalendar(Long departmentId);

    /** Update semester dates → triggers working day recalculation */
    AcademicCalendarResponse updateSemesterDates(Long semesterId, SemesterDateUpdateRequest request);

    /** Recalculate and return working day stats for a semester */
    AcademicCalendarResponse recalculate(Long semesterId);

    /**
     * Get attendance percentage for a student in a semester,
     * calculated only over working days.
     */
    double getWorkingDayAttendancePercentage(Long studentId, Long semesterId);
}
