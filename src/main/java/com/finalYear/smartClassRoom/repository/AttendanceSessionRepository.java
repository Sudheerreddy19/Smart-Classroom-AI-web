package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    List<AttendanceSession> findByTeacher(Teacher teacher);

    List<AttendanceSession> findBySubject(Subject subject);

    List<AttendanceSession> findByClassroom(Classroom classroom);

    List<AttendanceSession> findBySessionDate(LocalDate sessionDate);

    List<AttendanceSession> findByStatus(AttendanceSession.SessionStatus status);

    List<AttendanceSession> findByTimetable(Timetable timetable);

    @Query("""
        SELECT COUNT(a)
        FROM AttendanceSession a
        WHERE a.sessionDate = CURRENT_DATE
    """)
    long countTodaySessions();

    @Query("""
        SELECT COALESCE(
        AVG(
        CASE
        WHEN a.totalStudents > 0
        THEN (100.0 * a.presentCount / a.totalStudents)
        ELSE 0
        END
        ),
        0)
        FROM AttendanceSession a
    """)
    double getAverageAttendanceRate();

    // ── Department-scoped queries (Phase 2 RBAC) ─────────────────────────────
    List<AttendanceSession> findByTeacher_Department_IdAndSessionDate(
            Long departmentId, java.time.LocalDate sessionDate);

    @Query("""
        SELECT COUNT(a) FROM AttendanceSession a
        WHERE a.sessionDate = CURRENT_DATE
        AND a.teacher.department.id = :deptId
    """)
    long countTodaySessionsByDepartment(@org.springframework.data.repository.query.Param("deptId") Long deptId);

    // ── Used when permanently deleting a teacher ──────────────────────────────
    List<AttendanceSession> findByTeacher_Id(Long teacherId);

    // ── Academic Calendar: find sessions within a semester date range ─────────
    List<AttendanceSession> findBySessionDateBetween(java.time.LocalDate start, java.time.LocalDate end);

    @Query("""
        SELECT COUNT(a) FROM AttendanceSession a
        WHERE a.sessionDate BETWEEN :start AND :end
        AND a.teacher.department.id = :deptId
    """)
    long countSessionsInRangeForDepartment(
            @org.springframework.data.repository.query.Param("start")  java.time.LocalDate start,
            @org.springframework.data.repository.query.Param("end")    java.time.LocalDate end,
            @org.springframework.data.repository.query.Param("deptId") Long deptId);
}