package com.finalYear.smartClassRoom.mqtt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageHandler;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class MqttPublisher {

    private final ApplicationContext context;

    public MqttPublisher(ApplicationContext context) {
        this.context = context;
    }

    public void publish(String topic, String payload) {
        // Only try to get the bean when it actually exists
        if (!context.containsBean("mqttOutbound")) {
            log.debug("MQTT disabled — skipping publish to {}", topic);
            return;
        }
        try {
            MessageHandler handler = (MessageHandler) context.getBean("mqttOutbound");
            Message<String> message = MessageBuilder
                    .withPayload(payload)
                    .setHeader(MqttHeaders.TOPIC, topic)
                    .build();
            handler.handleMessage(message);
            log.debug("MQTT published → {}: {}", topic, payload);
        } catch (MessagingException e) {
            log.warn("MQTT publish failed for topic {}: {}", topic, e.getMessage());
            log.debug("MQTT publish exception detail", e);
        } catch (BeansException e) {
            log.warn("MQTT handler bean unavailable for topic {}: {}", topic, e.getMessage());
            log.debug("MQTT bean exception detail", e);
        }
    }
}
