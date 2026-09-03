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
import jakarta.persistence.Column;



@Entity
@Table(
        name = "classrooms",
        indexes = {
                @Index(name = "idx_classroom_room", columnList = "room_number"),
                @Index(name = "idx_classroom_camera", columnList = "camera_id"),
                @Index(name = "idx_classroom_esp32", columnList = "esp32_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "timetables")
@EqualsAndHashCode(of = "id")
public class Classroom implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, unique = true, length = 20)
    private String roomNumber;

    @Column(nullable = false)
    private Integer capacity;

    @Column(name = "camera_id", length = 100)
    private String cameraId;

    @Column(name = "esp32_id", length = 100)
    private String esp32Id;

    @Column(name = "projector_id", length = 100)
    private String projectorId;

    @Column(name = "microphone_id", length = 100)
    private String microphoneId;

    @Column(name = "speaker_id", length = 100)
    private String speakerId;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;


    @OneToMany(
            mappedBy = "classroom",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    @Builder.Default
    private List<Timetable> timetables = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    public boolean isConfigured() {
        return cameraId != null
                && esp32Id != null
                && projectorId != null;
    }
}