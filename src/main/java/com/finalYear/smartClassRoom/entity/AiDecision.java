package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_decisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private  Double temperature;

    private Double humidity;

    private Integer airQuality;

    private Integer light;

    private Boolean motion;

    private String fan;

    private String lightAction;

    private String projector;

    @Column(length = 1000)
    private String reason;

    @CreationTimestamp
    private LocalDateTime createdAt;
}