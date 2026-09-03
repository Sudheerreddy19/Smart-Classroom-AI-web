package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByDeviceId(String deviceId);

    boolean existsByDeviceId(String deviceId);

    List<Device> findByClassroom(Classroom classroom);

    List<Device> findByDeviceType(Device.DeviceType deviceType);

    List<Device> findByStatus(Device.DeviceStatus status);

    List<Device> findByActiveTrue();

    long countByStatus(Device.DeviceStatus deviceStatus);
}