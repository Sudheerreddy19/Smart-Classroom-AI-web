package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.StudentRequest;
import com.finalYear.smartClassRoom.dto.response.StudentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StudentService {

    StudentResponse createStudent(StudentRequest request);

    StudentResponse updateStudent(Long id, StudentRequest request);

    StudentResponse getStudentById(Long id);

    StudentResponse getStudentByRollNumber(String rollNumber);

    /**
     * Returns students visible to the caller.
     * SUPER_ADMIN/ADMIN can pass an optional departmentId to filter.
     * HOD/TEACHER always see only their own department.
     */
    Page<StudentResponse> getAllStudents(Pageable pageable, Long departmentId);

    List<StudentResponse> getStudentsByDepartmentAndSemester(
            Long departmentId,
            Long semesterId
    );

    void deleteStudent(Long id);

    // ── Semester Promotion ───────────────────────────────────────────────
    /**
     * Promotes a single student to the next semester.
     * If already in Sem 8, marks the student as graduated (active = false).
     */
    java.util.Map<String, Object> promoteStudent(Long studentId);

    /**
     * Bulk-promotes all active students in (departmentId, semesterId) to the next semester.
     * Students in Sem 8 are graduated (active = false).
     *
     * @return map: { promoted, graduated, total }
     */
    java.util.Map<String, Object> promoteStudentsBatch(Long departmentId, Long semesterId);

    /** Assign a student to a section */
    java.util.Map<String, Object> assignSection(Long studentId, Long sectionId);

    /** Get all students in a given section */
    java.util.List<?> getStudentsBySection(Long sectionId);
}