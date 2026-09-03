package com.finalYear.smartClassRoom.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WebSocketPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publish(String topic, Object payload) {

        messagingTemplate.convertAndSend(topic, payload);
    }


    public void publishToUser(String username,
                              String destination,
                              Object payload) {

        messagingTemplate.convertAndSendToUser(
                username,
                destination,
                payload
        );
    }
}