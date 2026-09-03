package com.finalYear.smartClassRoom.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
public class WebSocketEventListener {

    @EventListener
    public void connect(SessionConnectedEvent event) {

        log.info("WebSocket Client Connected");
    }

    @EventListener
    public void disconnect(SessionDisconnectEvent event) {
        log.info("WebSocket Client Disconnected");
    }
}