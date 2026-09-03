package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.Device;
import com.finalYear.smartClassRoom.entity.DeviceHealth;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DeviceHealthRepository extends JpaRepository<DeviceHealth, Long> {

    Optional<DeviceHealth> findByDevice(Device device);

    Optional<DeviceHealth> findByDevice_DeviceId(String deviceId);

}