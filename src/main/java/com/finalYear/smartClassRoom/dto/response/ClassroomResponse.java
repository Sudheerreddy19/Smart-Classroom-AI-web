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
public class ClassroomResponse {

    private Long id;
    private String roomNumber;
    private Integer capacity;
    private String cameraId;
    private String esp32Id;
    private String projectorId;
    private String microphoneId;
    private String speakerId;
    private boolean active;
    private Integer totalDevices;
    private Integer todayClasses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}