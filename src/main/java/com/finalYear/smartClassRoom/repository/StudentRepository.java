package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByRollNumber(String rollNumber);

    Optional<Student> findByUserId(Long userId);

    boolean existsByRollNumber(String rollNumber);

    boolean existsByAdmissionNumber(String admissionNumber);

    List<Student> findByDepartment(Department department);

    List<Student> findBySemester(Semester semester);

    List<Student> findByActiveTrue();

    // â”€â”€ Paginated queries (Phase 2 RBAC) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    Page<Student> findByActiveTrue(Pageable pageable);

    Page<Student> findByDepartment_IdAndActiveTrue(Long departmentId, Pageable pageable);

    long countByDepartment_Id(Long departmentId);

    List<Student> findByDepartmentAndSemester(Department department, Semester semester);

    /** Find students by dept ID + semester NUMBER (1-8) with eager fetch to avoid lazy loading */
    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.user LEFT JOIN FETCH s.department LEFT JOIN FETCH s.semester " +
           "WHERE s.department.id = :deptId AND s.semester.number = :semNum")
    List<Student> findByDepartment_IdAndSemester_Number(
            @Param("deptId") Long departmentId, @Param("semNum") int semesterNumber);

    /** All students in a department (active + inactive) - explicit fetch to avoid lazy loading issues */
    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.user LEFT JOIN FETCH s.department LEFT JOIN FETCH s.semester WHERE s.department.id = :deptId",
           countQuery = "SELECT COUNT(s) FROM Student s WHERE s.department.id = :deptId")
    Page<Student> findByDepartment_Id(@Param("deptId") Long departmentId, Pageable pageable);

    /** All students across all departments - explicit fetch */
    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.user LEFT JOIN FETCH s.department LEFT JOIN FETCH s.semester",
           countQuery = "SELECT COUNT(s) FROM Student s")
    Page<Student> findAllWithRelations(Pageable pageable);

    // â”€â”€ Section-based queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<Student> findByDepartment_IdAndSemester_IdAndSection_IdAndActiveTrue(
            Long departmentId, Long semesterId, Long sectionId);

    List<Student> findByDepartment_IdAndSemester_IdAndSection_Id(
            Long departmentId, Long semesterId, Long sectionId);

    // â”€â”€ Semester promotion â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<Student> findByDepartment_IdAndSemester_IdAndActiveTrue(
            Long departmentId, Long semesterId);

    long countByDepartment_IdAndSemester_IdAndActiveTrue(
            Long departmentId, Long semesterId);

    // â”€â”€ Student self-registration verification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    /** Verify roll number + date-of-birth match (for self-registration) */
    Optional<Student> findByRollNumberAndDateOfBirth(String rollNumber, LocalDate dateOfBirth);

    /** Check if a student has already created an account */
    @Query("SELECT s FROM Student s WHERE s.rollNumber = :rollNumber AND s.registrationStatus != 'NOT_REGISTERED'")
    Optional<Student> findRegisteredByRollNumber(@Param("rollNumber") String rollNumber);

    // â”€â”€ Pending registration lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    /** Students imported from Excel but not yet self-registered */
    List<Student> findByRegistrationStatus(Student.RegistrationStatus status);
    List<Student> findBySection(Section section);

    Page<Student> findByRegistrationStatus(Student.RegistrationStatus status, Pageable pageable);

    Page<Student> findByDepartment_IdAndRegistrationStatus(
            Long departmentId, Student.RegistrationStatus status, Pageable pageable);

    /** Students with account but no face encoding yet */
    @Query("""
           SELECT s FROM Student s
           WHERE s.registrationStatus = 'ACCOUNT_CREATED'
           AND s.active = true
           AND (:departmentId IS NULL OR s.department.id = :departmentId)
           """)
    Page<Student> findPendingFaceRegistration(
            @Param("departmentId") Long departmentId, Pageable pageable);

}