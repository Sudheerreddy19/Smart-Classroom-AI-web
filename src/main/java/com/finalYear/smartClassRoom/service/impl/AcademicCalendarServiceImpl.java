package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.SemesterDateUpdateRequest;
import com.finalYear.smartClassRoom.dto.response.AcademicCalendarResponse;
import com.finalYear.smartClassRoom.dto.response.AcademicCalendarResponse.DayInfo;
import com.finalYear.smartClassRoom.dto.response.AcademicCalendarResponse.MonthSummary;
import com.finalYear.smartClassRoom.dto.response.HolidayResponse;
import com.finalYear.smartClassRoom.entity.Attendance;
import com.finalYear.smartClassRoom.entity.AttendanceSession;
import com.finalYear.smartClassRoom.entity.Holiday;
import com.finalYear.smartClassRoom.entity.Semester;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.*;
import com.finalYear.smartClassRoom.service.AcademicCalendarService;
import com.finalYear.smartClassRoom.service.WorkingDayCalculatorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicCalendarServiceImpl implements AcademicCalendarService {

    private final SemesterRepository          semesterRepository;
    private final HolidayRepository           holidayRepository;
    private final AttendanceRepository        attendanceRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final StudentRepository           studentRepository;
    private final WorkingDayCalculatorService calculator;

    // ─── List all semester calendars (optionally filtered by dept) ────────────

    @Override
    public List<AcademicCalendarResponse> getAllCalendars(Long departmentId) {
        List<Semester> semesters = (departmentId != null)
                ? semesterRepository.findByDepartment_IdOrderByNumberAsc(departmentId)
                : semesterRepository.findAll().stream()
                        .sorted((a, b) -> {
                            int cmp = Integer.compare(a.getNumber(), b.getNumber());
                            if (cmp != 0) return cmp;
                            return Long.compare(a.getId(), b.getId());
                        }).collect(Collectors.toList());

        return semesters.stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    // ─── Single semester by DB id ─────────────────────────────────────────────

    @Override
    public AcademicCalendarResponse getCalendarBySemester(Long semesterId) {
        Semester sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));
        return buildResponse(sem);
    }

    // ─── By semester number within a department ───────────────────────────────

    @Override
    public AcademicCalendarResponse getCalendarBySemesterNumber(Long departmentId, int semesterNumber) {
        Semester sem = semesterRepository.findByDepartment_IdAndNumber(departmentId, semesterNumber)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Semester " + semesterNumber + " not found for department " + departmentId));
        return buildResponse(sem);
    }

    // ─── Currently active semester ────────────────────────────────────────────

    @Override
    public AcademicCalendarResponse getCurrentSemesterCalendar(Long departmentId) {
        LocalDate today = LocalDate.now();
        List<Semester> semesters = semesterRepository.findByDepartment_IdOrderByNumberAsc(departmentId);

        Semester current = semesters.stream()
                .filter(s -> s.getStartDate() != null && s.getEndDate() != null)
                .filter(s -> !today.isBefore(s.getStartDate()) && !today.isAfter(s.getEndDate()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No active semester found for department " + departmentId));

        return buildResponse(current);
    }

    // ─── Update semester dates ────────────────────────────────────────────────

    @Override
    @Transactional
    public AcademicCalendarResponse updateSemesterDates(Long semesterId, SemesterDateUpdateRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date.");
        }

        Semester sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));

        sem.setStartDate(request.getStartDate());
        sem.setEndDate(request.getEndDate());
        semesterRepository.save(sem);

        log.info("[AcademicCalendar] Updated Sem {} dates: {} → {}",
                sem.getNumber(), request.getStartDate(), request.getEndDate());

        return buildResponse(sem);
    }

    // ─── Recalculate (refresh after holidays change) ──────────────────────────

    @Override
    public AcademicCalendarResponse recalculate(Long semesterId) {
        return getCalendarBySemester(semesterId);
    }

    // ─── Attendance % using working days only ─────────────────────────────────

    @Override
    public double getWorkingDayAttendancePercentage(Long studentId, Long semesterId) {
        Semester sem = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        if (sem.getStartDate() == null || sem.getEndDate() == null) {
            return 0.0;
        }

        List<Holiday> holidays = holidayRepository.findByDateRangeAndSemester(
                sem.getStartDate(), sem.getEndDate(), sem.getNumber());

        List<AttendanceSession> sessions = attendanceSessionRepository
                .findBySessionDateBetween(sem.getStartDate(), sem.getEndDate());

        long totalSessions = sessions.stream()
                .filter(s -> calculator.isWorkingDay(s.getSessionDate(), calculator.toDateSet(holidays)))
                .count();

        if (totalSessions == 0) return 0.0;

        // Count sessions where student was PRESENT or LATE
        List<Attendance> allAttendances = attendanceRepository.findByStudent(student);
        long presentCount = allAttendances.stream()
                .filter(a -> {
                    LocalDate sessionDate = a.getAttendanceSession().getSessionDate();
                    return sessionDate != null
                            && !sessionDate.isBefore(sem.getStartDate())
                            && !sessionDate.isAfter(sem.getEndDate())
                            && calculator.isWorkingDay(sessionDate, calculator.toDateSet(holidays))
                            && (a.getStatus() == Attendance.AttendanceStatus.PRESENT
                                || a.getStatus() == Attendance.AttendanceStatus.LATE);
                }).count();

        return Math.round((100.0 * presentCount / totalSessions) * 100.0) / 100.0;
    }

    // ─── Builder ─────────────────────────────────────────────────────────────

    private AcademicCalendarResponse buildResponse(Semester sem) {
        LocalDate start = sem.getStartDate();
        LocalDate end   = sem.getEndDate();

        List<Holiday> holidays = (start != null && end != null)
                ? holidayRepository.findByDateRangeAndSemester(start, end, sem.getNumber())
                : List.of();

        int totalDays    = calculator.countTotalDays(start, end);
        int weekendDays  = calculator.countWeekendDays(start, end);
        int workingDays  = calculator.countWorkingDays(start, end, holidays);
        int effectiveHol = calculator.countEffectiveHolidays(start, end, holidays);

        // Count by type
        long national   = holidays.stream().filter(h -> h.getType() == Holiday.HolidayType.NATIONAL).count();
        long publicH    = holidays.stream().filter(h -> h.getType() == Holiday.HolidayType.PUBLIC).count();
        long college    = holidays.stream().filter(h -> h.getType() == Holiday.HolidayType.COLLEGE).count();
        long exam       = holidays.stream().filter(h -> h.getType() == Holiday.HolidayType.EXAM).count();

        boolean isCurrent = sem.isCurrentSemester();

        // Build month summaries
        List<MonthSummary> monthSummaries = buildMonthSummaries(start, end, holidays);

        // Build holiday responses
        List<HolidayResponse> holidayResponses = holidays.stream()
                .map(this::toHolidayResponse)
                .collect(Collectors.toList());

        return AcademicCalendarResponse.builder()
                .semesterId(sem.getId())
                .semesterName(sem.getName())
                .semesterNumber(sem.getNumber())
                .departmentId(sem.getDepartment() != null ? sem.getDepartment().getId() : null)
                .departmentName(sem.getDepartment() != null ? sem.getDepartment().getName() : null)
                .startDate(start)
                .endDate(end)
                .totalCalendarDays(totalDays)
                .totalWorkingDays(workingDays)
                .weekendDays(weekendDays)
                .totalHolidays(effectiveHol)
                .nationalHolidays((int) national)
                .publicHolidays((int) publicH)
                .collegeHolidays((int) college)
                .examHolidays((int) exam)
                .isCurrentSemester(isCurrent)
                .isActive(sem.isActive())
                .holidays(holidayResponses)
                .monthSummaries(monthSummaries)
                .build();
    }

    // ─── Month-by-month calendar grid builder ────────────────────────────────

    private List<MonthSummary> buildMonthSummaries(LocalDate start, LocalDate end, List<Holiday> holidays) {
        if (start == null || end == null) return List.of();

        List<MonthSummary> summaries = new ArrayList<>();
        LocalDate cursor = start.withDayOfMonth(1);

        while (!cursor.isAfter(end.withDayOfMonth(end.lengthOfMonth()))) {
            int year  = cursor.getYear();
            Month mon = cursor.getMonth();

            LocalDate monthStart = LocalDate.of(year, mon, 1);
            LocalDate monthEnd   = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

            // Clamp to semester boundaries
            LocalDate effectiveStart = monthStart.isBefore(start) ? start : monthStart;
            LocalDate effectiveEnd   = monthEnd.isAfter(end)      ? end   : monthEnd;

            List<DayInfo> days = buildDayInfoList(monthStart, monthEnd, effectiveStart, effectiveEnd, holidays);

            int workingInMonth  = (int) days.stream().filter(d -> "WORKING".equals(d.getDayType()) && d.isCurrentMonth()).count();
            int holidaysInMonth = (int) days.stream().filter(d -> !d.getDayType().startsWith("WORKING") && !d.getDayType().startsWith("WEEKEND") && d.isCurrentMonth()).count();
            int weekendsInMonth = (int) days.stream().filter(d -> d.getDayType().startsWith("WEEKEND") && d.isCurrentMonth()).count();

            summaries.add(MonthSummary.builder()
                    .year(year)
                    .month(mon.getValue())
                    .monthName(mon.getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                    .workingDays(workingInMonth)
                    .holidays(holidaysInMonth)
                    .weekends(weekendsInMonth)
                    .days(days)
                    .build());

            cursor = cursor.plusMonths(1);
            if (cursor.isAfter(end)) break;
        }

        return summaries;
    }

    private List<DayInfo> buildDayInfoList(
            LocalDate monthStart, LocalDate monthEnd,
            LocalDate semStart,  LocalDate semEnd,
            List<Holiday> holidays) {

        List<DayInfo> days = new ArrayList<>();
        LocalDate cur = monthStart;

        while (!cur.isAfter(monthEnd)) {
            // capture as final for use in lambda
            final LocalDate day = cur;
            boolean inSemester = !day.isBefore(semStart) && !day.isAfter(semEnd);
            String dayType     = inSemester ? calculator.getDayType(day, holidays) : "OUT_OF_SEMESTER";

            String holidayName = null;
            if (inSemester && !"WORKING".equals(dayType) && !dayType.startsWith("WEEKEND")) {
                holidayName = holidays.stream()
                        .filter(h -> h.getDate().equals(day))
                        .findFirst()
                        .map(Holiday::getName)
                        .orElse(null);
            }

            days.add(DayInfo.builder()
                    .date(day)
                    .dayType(inSemester ? dayType : "OUT_OF_SEMESTER")
                    .holidayName(holidayName)
                    .isCurrentMonth(true)
                    .build());

            cur = cur.plusDays(1);
        }
        return days;
    }

    // ─── Holiday → DTO ───────────────────────────────────────────────────────

    private HolidayResponse toHolidayResponse(Holiday h) {
        String typeLabel = switch (h.getType()) {
            case NATIONAL    -> "National Holiday";
            case PUBLIC      -> "Public Holiday";
            case COLLEGE     -> "College Holiday";
            case EXAM        -> "Exam Holiday";
            case RESTRICTED  -> "Restricted Holiday";
        };

        return HolidayResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .date(h.getDate())
                .dayOfWeek(h.getDate().getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                .type(h.getType())
                .typeLabel(typeLabel)
                .description(h.getDescription())
                .semesterNumber(h.getSemesterNumber())
                .active(h.isActive())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
