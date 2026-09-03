package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherAttendanceRepository extends JpaRepository<TeacherAttendance, Long> {

    List<TeacherAttendance> findByTeacher(Teacher teacher);

    List<TeacherAttendance> findByAttendanceDate(LocalDate attendanceDate);

    Optional<TeacherAttendance> findByTeacherAndAttendanceDate(
            Teacher teacher,
            LocalDate attendanceDate
    );

    List<TeacherAttendance> findByClassroom(Classroom classroom);

}