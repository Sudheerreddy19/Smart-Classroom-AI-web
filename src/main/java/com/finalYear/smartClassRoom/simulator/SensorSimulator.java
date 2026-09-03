package com.finalYear.smartClassRoom.simulator;

import com.finalYear.smartClassRoom.mqtt.MqttPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
@RequiredArgsConstructor
@Slf4j
public class SensorSimulator {

    private final MqttPublisher mqttPublisher;

    private final SecureRandom random = new SecureRandom();

    @Scheduled(fixedRate = 5000)
    public void sendSensorData() {

        double temperature = 24 + random.nextDouble() * 10;
        double humidity = 40 + random.nextDouble() * 40;
        int light = random.nextInt(1000);
        int airQuality = 200 + random.nextInt(300);
        boolean motion = random.nextBoolean();

        mqttPublisher.publish(
                "smartclassroom/sensors/temperature",
                String.format("%.2f", temperature));

        mqttPublisher.publish(
                "smartclassroom/sensors/humidity",
                String.format("%.2f", humidity));

        mqttPublisher.publish(
                "smartclassroom/sensors/light",
                String.valueOf(light));

        mqttPublisher.publish(
                "smartclassroom/sensors/airquality",
                String.valueOf(airQuality));

        mqttPublisher.publish(
                "smartclassroom/sensors/motion",
                String.valueOf(motion));

        log.info("Sensor data published.");
    }
}