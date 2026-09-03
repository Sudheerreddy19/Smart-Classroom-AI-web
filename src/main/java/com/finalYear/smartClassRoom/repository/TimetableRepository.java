package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.Classroom;
import com.finalYear.smartClassRoom.entity.Semester;
import com.finalYear.smartClassRoom.entity.Teacher;
import com.finalYear.smartClassRoom.entity.Section;
import com.finalYear.smartClassRoom.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByClassroom(Classroom classroom);

    List<Timetable> findByTeacher(Teacher teacher);

    List<Timetable> findBySemester(Semester semester);

    List<Timetable> findByClassroomAndDayOfWeek(
            Classroom classroom,
            Timetable.DayOfWeek dayOfWeek
    );

    List<Timetable> findByTeacherAndDayOfWeek(
            Teacher teacher,
            Timetable.DayOfWeek dayOfWeek
    );

    // â”€â”€ Department-scoped queries (Phase 2 RBAC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<Timetable> findByActiveTrue();

    List<Timetable> findBySection(Section section);

    List<Timetable> findBySection_IdAndActiveTrue(Long sectionId);

    void deleteBySection(Section section);

    List<Timetable> findByTeacher_Department_IdAndActiveTrue(Long departmentId);

}