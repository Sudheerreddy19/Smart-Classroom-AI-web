package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.Holiday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface HolidayRepository extends JpaRepository<Holiday, Long> {

    /** All active holidays (global + semester-specific) */
    List<Holiday> findByActiveTrue();

    /** Holidays for a specific semester number (includes global ones where semesterNumber is null) */
    @Query("SELECT h FROM Holiday h WHERE h.active = true AND (h.semesterNumber IS NULL OR h.semesterNumber = :semNum)")
    List<Holiday> findBySemesterNumberOrGlobal(@Param("semNum") int semesterNumber);

    /** Holidays within a date range for a given semester */
    @Query("""
        SELECT h FROM Holiday h
        WHERE h.active = true
        AND h.date BETWEEN :start AND :end
        AND (h.semesterNumber IS NULL OR h.semesterNumber = :semNum)
        ORDER BY h.date ASC
    """)
    List<Holiday> findByDateRangeAndSemester(
            @Param("start")  LocalDate start,
            @Param("end")    LocalDate end,
            @Param("semNum") int semesterNumber);

    /** All holidays in a date range regardless of semester */
    List<Holiday> findByDateBetweenAndActiveTrue(LocalDate start, LocalDate end);

    /** Check if a specific date is a holiday */
    boolean existsByDateAndActiveTrue(LocalDate date);

    /** All holidays of a specific type */
    List<Holiday> findByTypeAndActiveTrue(Holiday.HolidayType type);

    /** Global holidays only (semesterNumber is null) */
    List<Holiday> findBySemesterNumberIsNullAndActiveTrue();

    /** Count holidays for a semester in its date range */
    @Query("""
        SELECT COUNT(h) FROM Holiday h
        WHERE h.active = true
        AND h.date BETWEEN :start AND :end
        AND (h.semesterNumber IS NULL OR h.semesterNumber = :semNum)
    """)
    long countHolidaysInSemester(
            @Param("start")  LocalDate start,
            @Param("end")    LocalDate end,
            @Param("semNum") int semesterNumber);
}
