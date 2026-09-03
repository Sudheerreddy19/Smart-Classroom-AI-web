package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.entity.User.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    // Existing
    List<User> findByRole(Role role);

    long countByRole(Role role);

    Page<User> findByRoleIn(Set<Role> roles, Pageable pageable);

    List<User> findByEnabledTrue();

    List<User> findByRoleAndEnabledTrue(Role role);

    // ================================
    // New methods for Role Management
    // ================================

    Page<User> findByRole(Role role, Pageable pageable);

    Page<User> findByRoleAndCreatedBy(Role role,
                                      User createdBy,
                                      Pageable pageable);

    List<User> findByCreatedBy(User createdBy);

    Page<User> findByCreatedBy(User createdBy,
                               Pageable pageable);

    long countByCreatedBy(User createdBy);

    Page<User> findByRoleAndFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            Role role,
            String firstName,
            String lastName,
            Pageable pageable
    );

    Page<User> findByRoleAndCreatedByAndFirstNameContainingIgnoreCaseOrRoleAndCreatedByAndLastNameContainingIgnoreCase(
            Role role,
            User createdBy,
            String firstName,

            Role role2,
            User createdBy2,
            String lastName,

            Pageable pageable
    );

    // ── Department-filtered queries (Phase 2 RBAC) ───────────────────────────
    /**
     * Returns users whose role is in the given set AND who belong to the
     * specified department (via Teacher or Student profile).
     */
    @Query("""
        SELECT u FROM User u
        WHERE u.role IN :roles
        AND (
            u.id IN (SELECT t.user.id FROM Teacher t WHERE t.department.id = :deptId)
            OR
            u.id IN (SELECT s.user.id FROM Student s WHERE s.department.id = :deptId)
        )
    """)
    Page<User> findByRoleInAndDepartmentId(
            @Param("roles") Set<Role> roles,
            @Param("deptId") Long deptId,
            Pageable pageable
    );

    // ── Single role + dept (for ?role= filter) ────────────────────────────────
    @Query("""
        SELECT u FROM User u
        WHERE u.role = :role
        AND (
            u.id IN (SELECT t.user.id FROM Teacher t WHERE t.department.id = :deptId)
            OR
            u.id IN (SELECT s.user.id FROM Student s WHERE s.department.id = :deptId)
        )
    """)
    Page<User> findByRoleAndDepartmentId(
            @Param("role") Role role,
            @Param("deptId") Long deptId,
            Pageable pageable
    );

}