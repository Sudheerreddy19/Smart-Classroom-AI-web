package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "teachers",
        indexes = {
                @Index(name = "idx_teacher_employee", columnList = "employee_id"),
                @Index(name = "idx_teacher_department", columnList = "department_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"user", "department", "timetables"})
@EqualsAndHashCode(of = "id")
public class Teacher implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true,
            foreignKey = @ForeignKey(name = "fk_teacher_user")
    )
    private User user;

    @Column(name = "employee_id", nullable = false, unique = true, length = 30)
    private String employeeId;

    @Column(length = 100)
    private String designation;

    @Column(length = 200)
    private String specialization;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "department_id",
            foreignKey = @ForeignKey(name = "fk_teacher_department")
    )
    private Department department;

    @Column(name = "face_encoding_path", length = 500)
    private String faceEncodingPath;

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
            mappedBy = "teacher",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<Timetable> timetables = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    
    public String getFullName() {
        return user.getFirstName() + " " + user.getLastName();
    }


    public String getEmail() {
        return user.getEmail();
    }
}