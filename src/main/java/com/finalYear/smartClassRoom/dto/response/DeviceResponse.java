package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Device;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {

    private Long id;

    private String deviceId;

    private String deviceName;

    private Device.DeviceType deviceType;

    private Long classroomId;

    private String roomNumber;

    private Device.DeviceStatus status;

    private String ipAddress;

    private String macAddress;

    private String firmwareVersion;

    private LocalDateTime lastSeen;

    private boolean active;

    private LocalDateTime createdAt;
}