package com.finalYear.smartClassRoom.scheduler;

import com.finalYear.smartClassRoom.entity.Device;
import com.finalYear.smartClassRoom.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeviceHealthScheduler {

    private final DeviceRepository deviceRepository;

    @Scheduled(fixedRate = 60000)
    public void checkDevices() {

        deviceRepository.findAll().forEach(device -> {

            if (device.getLastHeartbeat() != null &&
                    device.getLastHeartbeat()
                            .isBefore(LocalDateTime.now().minusMinutes(2))) {

                device.setStatus(Device.DeviceStatus.OFFLINE);
                deviceRepository.save(device);

                log.info("{} marked OFFLINE", device.getDeviceId());
            }

        });
    }
}