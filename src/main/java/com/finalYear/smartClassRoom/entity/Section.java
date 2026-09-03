package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Represents a Section (e.g. A, B, C) within a Department + Semester.
 * Each section is a group of students who attend the same timetable slot.
 */
@Entity
@Table(
        name = "sections",
        uniqueConstraints = {
                @UniqueConstraint(
                        name  = "uq_section_dept_sem_name",
                        columnNames = {"department_id", "semester_id", "name"}
                )
        },
        indexes = {
                @Index(name = "idx_section_department", columnList = "department_id"),
                @Index(name = "idx_section_semester",   columnList = "semester_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"department", "semester"})
@EqualsAndHashCode(of = "id")
public class Section implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Section name: A, B, C, etc. */
    @Column(nullable = false, length = 10)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "department_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_section_department")
    )
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "semester_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_section_semester")
    )
    private Semester semester;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
