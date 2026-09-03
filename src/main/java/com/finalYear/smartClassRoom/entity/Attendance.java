package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "attendances",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_session_student",
                        columnNames = {"session_id", "student_id"}
                )
        },
        indexes = {
                @Index(name = "idx_attendance_session", columnList = "session_id"),
                @Index(name = "idx_attendance_student", columnList = "student_id"),
                @Index(name = "idx_attendance_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
@ToString(exclude = {
        "attendanceSession",
        "student"
})
@EqualsAndHashCode(of = "id")
public class Attendance implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "session_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_attendance_session")
    )
    private AttendanceSession attendanceSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_attendance_student")
    )
    private Student student;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.ABSENT;

    @Column(name = "marked_at")
    private LocalDateTime markedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false, length = 30)
    @Builder.Default
    private MarkingMethod method = MarkingMethod.FACE_RECOGNITION;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum AttendanceStatus {
        PRESENT,
        ABSENT,
        LATE,
        EXCUSED
    }

    public enum MarkingMethod {
        FACE_RECOGNITION,
        MANUAL,
        QR_CODE
    }
}