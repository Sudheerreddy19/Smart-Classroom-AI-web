package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.DeviceRequest;
import com.finalYear.smartClassRoom.dto.response.DeviceResponse;
import com.finalYear.smartClassRoom.service.DeviceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DeviceController {

    private final DeviceService deviceService;

    @PostMapping
    public ResponseEntity<DeviceResponse> registerDevice(
            @Valid @RequestBody DeviceRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(deviceService.registerDevice(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DeviceResponse> updateDevice(
            @PathVariable Long id,
            @Valid @RequestBody DeviceRequest request) {

        return ResponseEntity.ok(
                deviceService.updateDevice(id, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceResponse> getDeviceById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                deviceService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<DeviceResponse>> getAllDevices() {

        return ResponseEntity.ok(
                deviceService.getAll());
    }

    @GetMapping("/classroom/{classroomId}")
    public ResponseEntity<List<DeviceResponse>> getDevicesByClassroom(
            @PathVariable Long classroomId) {

        return ResponseEntity.ok(
                deviceService.getByClassroom(classroomId));
    }

    @PostMapping("/{deviceId}/control")
    public ResponseEntity<String> controlDevice(
            @PathVariable String deviceId,
            @RequestParam String action) {

        deviceService.controlDevice(deviceId, action);

        return ResponseEntity.ok("Device command sent successfully.");
    }

    @PostMapping("/{deviceId}/heartbeat")
    public ResponseEntity<String> updateHeartbeat(
            @PathVariable String deviceId) {

        deviceService.updateHeartbeat(deviceId);

        return ResponseEntity.ok("Heartbeat updated successfully.");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteDevice(
            @PathVariable Long id) {

        deviceService.delete(id);

        return ResponseEntity.ok("Device deleted successfully.");
    }
}