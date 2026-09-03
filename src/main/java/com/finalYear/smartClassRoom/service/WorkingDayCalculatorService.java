package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.Holiday;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Pure utility service — no DB access, no transactions.
 * Calculates working days by removing weekends and holidays from a date range.
 *
 * Working Day = weekday (Mon–Fri) that is NOT listed as a holiday.
 * Saturday and Sunday are always non-working (standard Indian college schedule).
 */
@Service
public class WorkingDayCalculatorService {

    /**
     * Count working days in [start, end] inclusive, excluding holidays.
     *
     * @param start     semester start date
     * @param end       semester end date
     * @param holidays  list of Holiday entities (already filtered for this semester)
     * @return number of working days
     */
    public int countWorkingDays(LocalDate start, LocalDate end, List<Holiday> holidays) {
        if (start == null || end == null || end.isBefore(start)) return 0;

        Set<LocalDate> holidayDates = toDateSet(holidays);
        int count = 0;
        LocalDate cursor = start;

        while (!cursor.isAfter(end)) {
            if (isWorkingDay(cursor, holidayDates)) count++;
            cursor = cursor.plusDays(1);
        }
        return count;
    }

    /**
     * Count total calendar days (inclusive).
     */
    public int countTotalDays(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) return 0;
        return (int) (end.toEpochDay() - start.toEpochDay() + 1);
    }

    /**
     * Count weekend days (Sat + Sun) in range.
     */
    public int countWeekendDays(LocalDate start, LocalDate end) {
        if (start == null || end == null || end.isBefore(start)) return 0;
        int count = 0;
        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            DayOfWeek dow = cursor.getDayOfWeek();
            if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) count++;
            cursor = cursor.plusDays(1);
        }
        return count;
    }

    /**
     * Count holidays that fall on weekdays (these actually reduce working days).
     */
    public int countEffectiveHolidays(LocalDate start, LocalDate end, List<Holiday> holidays) {
        if (start == null || end == null) return 0;
        return (int) holidays.stream()
                .filter(h -> h.isActive())
                .map(Holiday::getDate)
                .filter(d -> !d.isBefore(start) && !d.isAfter(end))
                .filter(d -> {
                    DayOfWeek dow = d.getDayOfWeek();
                    return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY;
                })
                .count();
    }

    /**
     * Check whether a specific date is a working day.
     */
    public boolean isWorkingDay(LocalDate date, Set<LocalDate> holidayDates) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) return false;
        return !holidayDates.contains(date);
    }

    /**
     * Determine the display type of a date for the calendar grid.
     * Returns: WORKING, WEEKEND_SAT, WEEKEND_SUN, or the holiday type name.
     */
    public String getDayType(LocalDate date, List<Holiday> holidays) {
        DayOfWeek dow = date.getDayOfWeek();
        if (dow == DayOfWeek.SATURDAY) return "WEEKEND_SAT";
        if (dow == DayOfWeek.SUNDAY)   return "WEEKEND_SUN";

        return holidays.stream()
                .filter(h -> h.isActive() && h.getDate().equals(date))
                .findFirst()
                .map(h -> h.getType().name())
                .orElse("WORKING");
    }

    /**
     * Convert holiday list to a set of dates for O(1) lookup.
     */
    public Set<LocalDate> toDateSet(List<Holiday> holidays) {
        return holidays.stream()
                .filter(Holiday::isActive)
                .map(Holiday::getDate)
                .collect(Collectors.toSet());
    }
}
