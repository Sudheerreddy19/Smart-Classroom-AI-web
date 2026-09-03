package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.Device;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DeviceRequest {

    @NotBlank(message = "Device ID is required")
    private String deviceId;

    @NotBlank(message = "Device name is required")
    private String deviceName;

    @NotNull(message = "Device type is required")
    private Device.DeviceType deviceType;

    @NotNull(message = "Classroom is required")
    private Long classroomId;

    private String ipAddress;

    private String macAddress;

    private String firmwareVersion;
}