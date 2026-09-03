package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "attendance_sessions",
        indexes = {
                @Index(name = "idx_session_date", columnList = "session_date"),
                @Index(name = "idx_session_teacher", columnList = "teacher_id"),
                @Index(name = "idx_session_subject", columnList = "subject_id"),
                @Index(name = "idx_session_classroom", columnList = "classroom_id"),
                @Index(name = "idx_session_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {
        "timetable",
        "classroom",
        "subject",
        "teacher",
        "attendances"
})
@EqualsAndHashCode(of = "id")
public class AttendanceSession implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "timetable_id",
            foreignKey = @ForeignKey(name = "fk_session_timetable")
    )
    private Timetable timetable;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "classroom_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_classroom")
    )
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "subject_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_subject")
    )
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "teacher_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_session_teacher")
    )
    private Teacher teacher;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    @Column(name = "total_students")
    private Integer totalStudents;

    @Builder.Default
    @Column(name = "present_count", nullable = false)
    private Integer presentCount = 0;

    @OneToMany(
            mappedBy = "attendanceSession",
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

    public enum SessionStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }
}