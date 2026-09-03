package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.SensorReading;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    Optional<SensorReading> findTopBySensorTypeOrderByCreatedAtDesc(String sensorType);

}