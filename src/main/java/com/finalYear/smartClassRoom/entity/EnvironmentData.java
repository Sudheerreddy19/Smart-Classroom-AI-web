package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "environment_data",
        indexes = {
                @Index(name = "idx_env_classroom", columnList = "classroom_id"),
                @Index(name = "idx_env_recorded_at", columnList = "recorded_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvironmentData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;
    private Double temperature;

    private Double humidity;

    @Column(name = "co2_level")
    private Double co2Level;

    @Column(name = "light_level")
    private Double lightLevel;

    @Column(name = "noise_level")
    private Double noiseLevel;

    @Column(name = "air_quality_index")
    private Double airQualityIndex;

    @CreationTimestamp
    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;
}