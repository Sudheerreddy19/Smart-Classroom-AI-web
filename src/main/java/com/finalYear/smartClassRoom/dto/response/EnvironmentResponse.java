package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnvironmentResponse {

    private Long id;

    private Long classroomId;

    private String roomNumber;

    private Double temperature;

    private Double humidity;

    private Double co2Level;

    private Double lightLevel;

    private Double noiseLevel;

    private Double airQualityIndex;

    private LocalDateTime recordedAt;
}