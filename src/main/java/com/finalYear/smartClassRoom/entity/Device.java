package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "devices",
        indexes = {
                @Index(name = "idx_device_device_id", columnList = "device_id"),
                @Index(name = "idx_device_classroom", columnList = "classroom_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false, unique = true, length = 100)
    private String deviceId;

    @Column(name = "device_name", nullable = false, length = 100)
    private String deviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private DeviceType deviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false, length = 20)
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "mac_address", length = 20)
    private String macAddress;

    @Column(name = "firmware_version", length = 30)
    private String firmwareVersion;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    public enum DeviceType {
        CAMERA,
        ESP32,
        PROJECTOR,
        SPEAKER,
        MICROPHONE,
        SENSOR,
        RELAY
    }

    public enum DeviceStatus {
        ONLINE,
        OFFLINE,
        ERROR,
        MAINTENANCE
    }
}