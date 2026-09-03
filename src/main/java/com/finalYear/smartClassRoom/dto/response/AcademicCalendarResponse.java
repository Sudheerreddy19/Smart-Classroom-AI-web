package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AcademicCalendarResponse {

    private Long semesterId;
    private String semesterName;
    private Integer semesterNumber;
    private String departmentName;
    private Long departmentId;

    private LocalDate startDate;
    private LocalDate endDate;

    // Calculated working day statistics
    private int totalCalendarDays;
    private int totalWorkingDays;
    private int weekendDays;
    private int totalHolidays;
    private int nationalHolidays;
    private int publicHolidays;
    private int collegeHolidays;
    private int examHolidays;

    private boolean isCurrentSemester;
    private boolean isActive;

    private List<HolidayResponse> holidays;

    /** Month-by-month breakdown for calendar grid view */
    private List<MonthSummary> monthSummaries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthSummary {
        private int year;
        private int month;
        private String monthName;
        private int workingDays;
        private int holidays;
        private int weekends;
        private List<DayInfo> days;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayInfo {
        private LocalDate date;
        private String dayType; // WORKING, WEEKEND_SAT, WEEKEND_SUN, NATIONAL, PUBLIC, COLLEGE, EXAM, RESTRICTED
        private String holidayName;
        private boolean isCurrentMonth;
    }
}
