package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.DeviceRequest;
import com.finalYear.smartClassRoom.dto.response.DeviceResponse;

import java.util.List;

public interface DeviceService {

    DeviceResponse registerDevice(DeviceRequest request);

    DeviceResponse updateDevice(Long id, DeviceRequest request);

    DeviceResponse getById(Long id);

    List<DeviceResponse> getAll();

    List<DeviceResponse> getByClassroom(Long classroomId);

    void controlDevice(String deviceId, String action);

    void updateHeartbeat(String deviceId);

    void delete(Long id);
}