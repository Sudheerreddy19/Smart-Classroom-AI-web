package com.finalYear.smartClassRoom.mqtt;

import com.finalYear.smartClassRoom.service.AiAnalysisService;
import com.finalYear.smartClassRoom.service.SensorReadingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "mqtt.enabled", havingValue = "true", matchIfMissing = false)
public class MqttSubscriber {

    private final SensorReadingService sensorService;
    private final AiAnalysisService aiService;

    private Double temperature;
    private Double humidity;
    private Integer light;
    private Integer airQuality;
    private Boolean motion;

    @ServiceActivator(inputChannel = "mqttInputChannel")
    public void receive(Message<?> message) {
        String topic   = (String) message.getHeaders().get(MqttHeaders.RECEIVED_TOPIC);
        String payload = message.getPayload().toString();
        log.info("MQTT ← {}: {}", topic, payload);

        String sensorType = topic.substring(topic.lastIndexOf("/") + 1);
        sensorService.save(sensorType, payload);

        switch (sensorType) {
            case "temperature" -> temperature = Double.parseDouble(payload);
            case "humidity"    -> humidity    = Double.parseDouble(payload);
            case "light"       -> light       = Integer.parseInt(payload);
            case "airquality"  -> airQuality  = Integer.parseInt(payload);
            case "motion"      -> motion      = Boolean.parseBoolean(payload);
            default            -> log.warn("Unknown sensor type received: {}", sensorType);
        }

        if (temperature != null && humidity != null && light != null && airQuality != null && motion != null) {
            aiService.analyze(temperature, humidity, light, airQuality, motion);
        }
    }
}
