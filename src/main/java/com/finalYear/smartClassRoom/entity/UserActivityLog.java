package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stores every CREATE / READ / UPDATE / DELETE action performed by any role
 * on another user account — separate table from audit_logs.
 *
 * Role hierarchy enforced:
 *   SUPER_ADMIN  → ADMIN, HOD, TEACHER, STUDENT
 *   ADMIN        → HOD, TEACHER, STUDENT
 *   HOD          → TEACHER, STUDENT
 *   TEACHER      → STUDENT
 *   STUDENT      → (none)
 */
@Entity
@Table(
    name = "user_activity_logs",
    indexes = {
        @Index(name = "idx_ual_actor",      columnList = "actor_id"),
        @Index(name = "idx_ual_target",     columnList = "target_user_id"),
        @Index(name = "idx_ual_operation",  columnList = "operation"),
        @Index(name = "idx_ual_created",    columnList = "created_at")
    }
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Who performed the action
    @Column(name = "actor_id")
    private Long actorId;

    @Column(name = "actor_email", length = 150)
    private String actorEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "actor_role", length = 20)
    private User.Role actorRole;

    // What operation was performed
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Operation operation;   // CREATE, READ, UPDATE, DELETE

    // Who was affected
    @Column(name = "target_user_id")
    private Long targetUserId;

    @Column(name = "target_email", length = 150)
    private String targetEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_role", length = 20)
    private User.Role targetRole;

    // What changed (JSON or description)
    @Column(length = 1000)
    private String details;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum Operation { CREATE, READ, UPDATE, DELETE }
}
