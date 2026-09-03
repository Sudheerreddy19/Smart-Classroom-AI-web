package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_user",      columnList = "user_id"),
        @Index(name = "idx_audit_action",    columnList = "action"),
        @Index(name = "idx_audit_created",   columnList = "created_at")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "user_role", length = 20)
    private User.Role userRole;

    @Column(nullable = false, length = 100)
    private String action;                  // e.g. "CREATE_STUDENT", "DELETE_DEVICE"

    @Column(name = "entity_type", length = 50)
    private String entityType;              // e.g. "Student", "Device"

    @Column(name = "entity_id")
    private Long entityId;

    @Column(length = 1000)
    private String details;                 // JSON or human-readable description

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private AuditStatus status = AuditStatus.SUCCESS;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AuditStatus { SUCCESS, FAILURE }
}
