package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.entity.Device;
import com.finalYear.smartClassRoom.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class DeviceAgent extends BaseAgent {

    private final DeviceRepository deviceRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        long total   = deviceRepository.count();
        long online  = deviceRepository.countByStatus(Device.DeviceStatus.ONLINE);
        long offline = deviceRepository.countByStatus(Device.DeviceStatus.OFFLINE);

        String dataCtx = String.format(
            "IoT Device data: %d total devices, %d online, %d offline.",
            total, online, offline
        );
        String ollama = callOllama(
            "You are an IoT device monitoring assistant for a Smart Classroom. Use real data. Be concise.",
            dataCtx + " Request: " + request.getPrompt()
        );
        if (ollama != null) {
            return AgentResponse.builder().answer(ollama).agentName(agentName())
                .ollamaGenerated(true)
                .data(Map.of("total", total, "online", online, "offline", offline)).build();
        }

        return AgentResponse.builder()
            .answer(String.format(
                "Device status: %d total devices, %d online (%.1f%%), %d offline.\n" +
                "Visit the Devices section to view individual device status, power consumption, and control options.",
                total, online, total > 0 ? (online * 100.0 / total) : 0, offline
            ))
            .agentName(agentName())
            .data(Map.of("total", total, "online", online, "offline", offline)).build();
    }

    @Override protected String agentName() { return "DeviceAgent"; }
}
