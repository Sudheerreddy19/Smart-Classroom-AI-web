package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "marks",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_student_subject_exam",
                        columnNames = {
                                "student_id",
                                "subject_id",
                                "semester_id",
                                "exam_type"
                        }
                )
        },
        indexes = {
                @Index(name = "idx_marks_student", columnList = "student_id"),
                @Index(name = "idx_marks_subject", columnList = "subject_id"),
                @Index(name = "idx_marks_semester", columnList = "semester_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Marks {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;


    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false, length = 30)
    private ExamType examType;

    @Column(name = "marks_obtained")
    private Double marksObtained;

    @Column(name = "max_marks")
    private Double maxMarks;

    @Column(length = 5)
    private String grade;

    @Column(length = 255)
    private String remarks;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum ExamType {
        INTERNAL_1,
        INTERNAL_2,
        INTERNAL_3,
        MID_1,
        MID_2,
        ASSIGNMENT,
        QUIZ,
        PRACTICAL,
        FINAL
    }
}