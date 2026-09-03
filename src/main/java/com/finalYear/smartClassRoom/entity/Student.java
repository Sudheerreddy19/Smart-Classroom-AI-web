package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "students",
        indexes = {
                @Index(name = "idx_student_roll_number", columnList = "roll_number"),
                @Index(name = "idx_student_department",  columnList = "department_id"),
                @Index(name = "idx_student_semester",    columnList = "semester_id"),
                @Index(name = "idx_student_section",     columnList = "section_id"),
                @Index(name = "idx_student_status",      columnList = "registration_status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {
        "user",
        "department",
        "semester",
        "section",
        "faces",
        "attendances"
})
@EqualsAndHashCode(of = "id")
public class Student implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(
            name = "user_id",
            nullable = true,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_student_user")
    )
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true, length = 30)
    private String rollNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            foreignKey = @ForeignKey(name = "fk_student_department")
    )
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "semester_id",
            foreignKey = @ForeignKey(name = "fk_student_semester")
    )
    private Semester semester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "section_id",
            foreignKey = @ForeignKey(name = "fk_student_section")
    )
    private Section section;

    /** Auto-assigned classroom (e.g. CSE-A, CSE-B) based on department + capacity */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "classroom_id",
            nullable = true,
            foreignKey = @ForeignKey(name = "fk_student_classroom")
    )
    private Classroom classroom;

    // ── Academic identifiers (set at import, student cannot change) ──────────
    @Column(name = "admission_number", length = 50)
    private String admissionNumber;

    /** Official institutional email assigned at import (read-only for student) */
    @Column(name = "official_email", length = 150)
    private String officialEmail;

    /** Academic year e.g. "2024-25" */
    @Column(name = "academic_year", length = 10)
    private String academicYear;

    @Column(name = "branch", length = 100)
    private String branch;

    // ── Registration lifecycle ───────────────────────────────────────────────
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "registration_status", nullable = false, length = 20)
    private RegistrationStatus registrationStatus = RegistrationStatus.NOT_REGISTERED;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(length = 500)
    private String address;

    @Column(name = "guardian_name", length = 100)
    private String guardianName;

    @Column(name = "guardian_phone", length = 15)
    private String guardianPhone;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name="first_name",length=20)
    private String firstName;

    @Column(name="lastname",length=20)
    private String lastName;

    @Column(name = "student_phone", length = 15)
    private String phone;

    @OneToMany(
            mappedBy = "student",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<StudentFace> faces = new ArrayList<>();

    @OneToMany(
            mappedBy = "student",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<Attendance> attendances = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Convenience helpers ──────────────────────────────────────────────────

    public String getFullName() {
        if (user != null) return user.getFirstName() + " " + user.getLastName();
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "");
    }

    public String getEmail() {
        return user != null ? user.getEmail() : officialEmail;
    }

    public String getFirstName() {
        return user != null ? user.getFirstName() : firstName;
    }

    public String getLastName() {
        return user != null ? user.getLastName() : lastName;
    }

    public String getPhone() {
        return user != null ? user.getPhone() : phone;
    }

    /** Returns true only when a face encoding is captured and ready. */
    public boolean isFaceRegistered() {
        return registrationStatus == RegistrationStatus.FACE_REGISTERED;
    }

    // ── Registration Status ──────────────────────────────────────────────────

    /**
     * Tracks the student lifecycle:
     * NOT_REGISTERED  → imported from Excel, no login account yet
     * ACCOUNT_CREATED → student completed self-registration with password
     * FACE_REGISTERED → teacher captured and encoded face images
     */
    public enum RegistrationStatus {
        NOT_REGISTERED,
        ACCOUNT_CREATED,
        FACE_REGISTERED
    }
}