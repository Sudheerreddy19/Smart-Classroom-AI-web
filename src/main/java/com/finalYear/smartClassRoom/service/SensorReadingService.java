package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.SensorReading;
import com.finalYear.smartClassRoom.repository.SensorReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorReadingService {

    private final SensorReadingRepository repository;

    /**
     * Save a raw sensor reading.
     *
     * @param classroomId The classroom/room identifier from the MQTT topic or device config.
     * @param sensorType  The type of sensor (temperature, humidity, airquality, etc.)
     * @param sensorValue The raw string value from the sensor payload.
     */
    public void save(String classroomId, String sensorType, String sensorValue) {
        try {
            SensorReading reading = SensorReading.builder()
                    .classroomId(classroomId)
                    .sensorType(sensorType)
                    .sensorValue(sensorValue)
                    .build();
            repository.save(reading);
        } catch (Exception e) {
            log.warn("Failed to save sensor reading [{} / {}]: {}", sensorType, sensorValue, e.getMessage());
        }
    }

    /**
     * Convenience overload — uses a default classroomId when not provided by hardware.
     * Used by the simulator when no room context is available.
     */
    public void save(String sensorType, String sensorValue) {
        save("SIMULATOR", sensorType, sensorValue);
    }
}
