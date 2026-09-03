package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    Optional<Teacher> findByEmployeeId(String employeeId);

    Optional<Teacher> findByUserId(Long userId);

    boolean existsByEmployeeId(String employeeId);

    List<Teacher> findByDepartment(Department department);

    Page<Teacher> findByActiveTrue(Pageable pageable);

    // ── Department-scoped queries (Phase 2 RBAC) ────────────────────────────
    Page<Teacher> findByDepartment_IdAndActiveTrue(Long departmentId, Pageable pageable);

    long countByDepartment_IdAndActiveTrue(Long departmentId);

}