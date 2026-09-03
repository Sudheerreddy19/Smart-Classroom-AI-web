package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface MarksRepository extends JpaRepository<Marks, Long> {

    List<Marks> findByStudent(Student student);

    List<Marks> findBySubject(Subject subject);

    List<Marks> findBySemester(Semester semester);

    List<Marks> findByStudentAndSubject(Student student, Subject subject);

    List<Marks> findByStudentAndSemester(Student student, Semester semester);

    List<Marks> findByExamType(Marks.ExamType examType);

    // ── Used when permanently deleting a student ──────────────────────────────
    // Uses JPQL DELETE query to avoid the SELECT+delete-per-row overhead of derived methods.
    @Modifying
    @Transactional
    @Query("DELETE FROM Marks m WHERE m.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);

    // ── Used when permanently deleting a teacher ──────────────────────────────
    // Sets teacher_id = NULL for marks that still need to exist (exam records),
    // rather than deleting them, since teacher is nullable on marks.
    @Modifying
    @Transactional
    @Query("UPDATE Marks m SET m.teacher = NULL WHERE m.teacher.id = :teacherId")
    void clearTeacherFromMarks(@Param("teacherId") Long teacherId);

}