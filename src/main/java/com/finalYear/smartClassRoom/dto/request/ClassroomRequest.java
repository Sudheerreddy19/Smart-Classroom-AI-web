package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ClassroomRequest {

    @NotBlank(message = "Room number is required")
    private String roomNumber;

    @Min(value = 1, message = "Capacity must be greater than 0")
    private Integer capacity;

    private String cameraId;

    private String esp32Id;

    private String projectorId;

    private String microphoneId;

    private String speakerId;

    private boolean active = true;
}