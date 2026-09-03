package com.finalYear.smartClassRoom.mqtt;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MqttMessageHandler {

    public void process(String topic, String payload) {
        if (MqttTopics.ATTENDANCE.equals(topic)) {
            log.info("Attendance: {}", payload);
        } else if (MqttTopics.ENVIRONMENT.equals(topic)) {
            log.info("Environment: {}", payload);
        } else if (MqttTopics.DEVICE_STATUS.equals(topic)) {
            log.info("Device Status: {}", payload);
        } else {
            log.info("Unknown Topic {} -> {}", topic, payload);
        }
    }
}