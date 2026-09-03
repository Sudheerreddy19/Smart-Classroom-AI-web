package com.finalYear.smartClassRoom.config;

import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.entity.Holiday;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.HolidayRepository;
import com.finalYear.smartClassRoom.service.impl.SemesterServiceImpl;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Runs once on every startup:
 *  1. Ensures ALL departments have semesters 1-8 (auto-creates missing ones with default dates)
 *  2. Seeds Indian national holidays for 2026-2030 if not already present
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AcademicCalendarDataInitializer implements ApplicationRunner {

    private final DepartmentRepository  departmentRepository;
    private final HolidayRepository     holidayRepository;
    private final SemesterServiceImpl   semesterService;
    private final EntityManager         entityManager;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        repairNullRegistrationStatus();   // fix existing students with null status
        seedSemestersForAllDepartments();
        seedNationalHolidays();
    }

    // ─── Step 0: repair registration_status + active flag for pre-existing students ────

    private void repairNullRegistrationStatus() {
        // Students who have a linked user account but status is NULL → ACCOUNT_CREATED
        int fixed1 = entityManager.createQuery(
                "UPDATE Student s SET s.registrationStatus = com.finalYear.smartClassRoom.entity.Student.RegistrationStatus.ACCOUNT_CREATED " +
                "WHERE s.registrationStatus IS NULL AND s.user IS NOT NULL"
        ).executeUpdate();

        // Students with no user account but status is NULL → NOT_REGISTERED
        int fixed2 = entityManager.createQuery(
                "UPDATE Student s SET s.registrationStatus = com.finalYear.smartClassRoom.entity.Student.RegistrationStatus.NOT_REGISTERED " +
                "WHERE s.registrationStatus IS NULL AND s.user IS NULL"
        ).executeUpdate();

        // Students who have a user account but are still NOT_REGISTERED → upgrade to ACCOUNT_CREATED
        // This covers students created via admin form before the builder was fixed
        int fixed4 = entityManager.createQuery(
                "UPDATE Student s SET s.registrationStatus = com.finalYear.smartClassRoom.entity.Student.RegistrationStatus.ACCOUNT_CREATED " +
                "WHERE s.registrationStatus = com.finalYear.smartClassRoom.entity.Student.RegistrationStatus.NOT_REGISTERED AND s.user IS NOT NULL"
        ).executeUpdate();

        // Students with a linked user account should always be active
        int fixed3 = entityManager.createQuery(
                "UPDATE Student s SET s.active = true " +
                "WHERE s.active = false AND s.user IS NOT NULL"
        ).executeUpdate();

        int total = fixed1 + fixed2 + fixed3 + fixed4;
        if (total > 0) {
            log.info("[Data Repair] Fixed {} students: {} null→account-created, {} null→not-registered, " +
                     "{} not-registered→account-created (had user), {} re-activated.",
                    total, fixed1, fixed2, fixed4, fixed3);
        } else {
            log.info("[Data Repair] All students OK, no repair needed.");
        }
    }

    // ─── Step 1: ensure 8 semesters exist for EVERY department ───────────────

    private void seedSemestersForAllDepartments() {
        List<Department> departments = departmentRepository.findAll();
        if (departments.isEmpty()) {
            log.info("[Calendar Init] No departments found yet. Semesters will be created when departments are added.");
            return;
        }
        for (Department dept : departments) {
            semesterService.ensureSemestersExist(dept);
        }
        log.info("[Calendar Init] Ensured 8 semesters exist for {} department(s).", departments.size());
    }

    // ─── Step 2: seed Indian national holidays 2026-2030 ─────────────────────

    private void seedNationalHolidays() {
        // Only seed if no holidays exist at all
        long existing = holidayRepository.count();
        if (existing > 0) {
            log.info("[Calendar Init] {} holidays already exist. Skipping seed.", existing);
            return;
        }

        List<Holiday> holidays = new ArrayList<>();

        // ── 2026-27 (Sem 1 & 2) ───────────────────────────────────────────────
        holidays.add(national("Republic Day",          LocalDate.of(2027, 1, 26)));
        holidays.add(national("Independence Day",       LocalDate.of(2026, 8, 15)));
        holidays.add(national("Gandhi Jayanti",         LocalDate.of(2026, 10, 2)));
        holidays.add(pub_h   ("Dussehra",               LocalDate.of(2026, 10, 2)));   // approx
        holidays.add(pub_h   ("Diwali",                 LocalDate.of(2026, 10, 20)));  // approx
        holidays.add(pub_h   ("Christmas",              LocalDate.of(2026, 12, 25)));
        holidays.add(pub_h   ("New Year",               LocalDate.of(2027, 1, 1)));

        // ── 2027 (Sem 2) ─────────────────────────────────────────────────────
        holidays.add(national("Independence Day",       LocalDate.of(2027, 8, 15)));
        holidays.add(national("Gandhi Jayanti",         LocalDate.of(2027, 10, 2)));
        holidays.add(pub_h   ("Holi",                   LocalDate.of(2027, 3, 22)));   // approx
        holidays.add(pub_h   ("Diwali",                 LocalDate.of(2027, 11, 8)));   // approx
        holidays.add(pub_h   ("Christmas",              LocalDate.of(2027, 12, 25)));

        // ── 2028 (Sem 3 & 4) ─────────────────────────────────────────────────
        holidays.add(national("Republic Day",           LocalDate.of(2028, 1, 26)));
        holidays.add(national("Independence Day",       LocalDate.of(2028, 8, 15)));
        holidays.add(national("Gandhi Jayanti",         LocalDate.of(2028, 10, 2)));
        holidays.add(pub_h   ("Holi",                   LocalDate.of(2028, 3, 11)));   // approx
        holidays.add(pub_h   ("Diwali",                 LocalDate.of(2028, 10, 26)));  // approx
        holidays.add(pub_h   ("Christmas",              LocalDate.of(2028, 12, 25)));
        holidays.add(pub_h   ("New Year",               LocalDate.of(2028, 1, 1)));

        // ── 2029 (Sem 5 & 6) ─────────────────────────────────────────────────
        holidays.add(national("Republic Day",           LocalDate.of(2029, 1, 26)));
        holidays.add(national("Independence Day",       LocalDate.of(2029, 8, 15)));
        holidays.add(national("Gandhi Jayanti",         LocalDate.of(2029, 10, 2)));
        holidays.add(pub_h   ("Holi",                   LocalDate.of(2029, 3, 1)));    // approx
        holidays.add(pub_h   ("Diwali",                 LocalDate.of(2029, 10, 15)));  // approx
        holidays.add(pub_h   ("Christmas",              LocalDate.of(2029, 12, 25)));
        holidays.add(pub_h   ("New Year",               LocalDate.of(2029, 1, 1)));

        // ── 2030 (Sem 7 & 8) ─────────────────────────────────────────────────
        holidays.add(national("Republic Day",           LocalDate.of(2030, 1, 26)));
        holidays.add(national("Independence Day",       LocalDate.of(2030, 8, 15)));
        holidays.add(national("Gandhi Jayanti",         LocalDate.of(2030, 10, 2)));
        holidays.add(pub_h   ("Holi",                   LocalDate.of(2030, 3, 19)));   // approx
        holidays.add(pub_h   ("Diwali",                 LocalDate.of(2030, 11, 4)));   // approx
        holidays.add(pub_h   ("Christmas",              LocalDate.of(2030, 12, 25)));
        holidays.add(pub_h   ("New Year",               LocalDate.of(2030, 1, 1)));

        holidayRepository.saveAll(holidays);
        log.info("[Calendar Init] Seeded {} national/public holidays for 2026-2030.", holidays.size());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Holiday national(String name, LocalDate date) {
        return Holiday.builder()
                .name(name).date(date)
                .type(Holiday.HolidayType.NATIONAL)
                .active(true).build();
    }

    private Holiday pub_h(String name, LocalDate date) {
        return Holiday.builder()
                .name(name).date(date)
                .type(Holiday.HolidayType.PUBLIC)
                .active(true).build();
    }
}
