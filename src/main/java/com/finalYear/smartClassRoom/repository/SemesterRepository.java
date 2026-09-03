package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SemesterRepository extends JpaRepository<Semester, Long> {

    List<Semester> findByDepartment(Department department);

    List<Semester> findByActiveTrue();

    List<Semester> findByDepartmentAndActiveTrue(Department department);

    Semester findByDepartmentAndNumber(Department department, Integer number);

    // ── Semester promotion ──────────────────────────────────────────────────
    // Find the next semester in this department (number = currentNumber + 1)
    java.util.Optional<Semester> findByDepartment_IdAndNumber(Long departmentId, Integer number);

    List<Semester> findByDepartment_IdOrderByNumberAsc(Long departmentId);

}