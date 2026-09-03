package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.AiDecision;
import com.finalYear.smartClassRoom.repository.AiDecisionRepository;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.ollama.OllamaChatModel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.request.ChatRequest;

@Service
@Slf4j
public class AiAnalysisService {

    @Autowired(required = false)
    private OllamaChatModel ollamaModel;

    private final AiDecisionRepository aiDecisionRepository;

    public AiAnalysisService(AiDecisionRepository aiDecisionRepository) {
        this.aiDecisionRepository = aiDecisionRepository;
    }

    public AiDecision analyze(Double temperature,
                              Double humidity,
                              Integer light,
                              Integer airQuality,
                              Boolean motion) {

        if (ollamaModel == null) {

            log.debug("Ollama not available — using rule-based decision");

            return saveDecision(
                    temperature,
                    humidity,
                    light,
                    airQuality,
                    motion,
                    motion ? "ON" : "OFF",
                    light < 300 ? "ON" : "OFF",
                    motion ? "ON" : "OFF",
                    "Rule-based (Ollama unavailable)"
            );
        }

        String prompt = """
You are an AI Smart Classroom Controller.

Sensor Values:
Temperature=%s°C
Humidity=%s%%
Light=%s lux
AirQuality=%s AQI
Motion=%s

Decide optimal device settings.

Return ONLY in this format:

Fan=ON/OFF
Light=ON/OFF
Projector=ON/OFF
Reason=Short explanation
""".formatted(
                temperature,
                humidity,
                light,
                airQuality,
                motion
        );

        try {

            ChatRequest request = ChatRequest.builder()
                    .messages(UserMessage.from(prompt))
                    .build();

            var response = ollamaModel.chat(request);
            String aiResponse = response.aiMessage().text();

            log.info("Ollama Response:\n{}", aiResponse);

            return parseAndSave(
                    aiResponse,
                    temperature,
                    humidity,
                    light,
                    airQuality,
                    motion
            );

        } catch (Exception e) {

            log.error("Ollama Error", e);

            return saveDecision(
                    temperature,
                    humidity,
                    light,
                    airQuality,
                    motion,
                    "OFF",
                    "OFF",
                    "OFF",
                    "AI unavailable"
            );
        }
    }

    private AiDecision parseAndSave(String response,
                                    Double temp,
                                    Double hum,
                                    Integer light,
                                    Integer aq,
                                    Boolean motion) {

        String fan = "OFF";
        String lightAction = "OFF";
        String projector = "OFF";
        String reason = "";

        for (String line : response.split("\\R")) {

            line = line.trim();

            if (line.startsWith("Fan=")) {

                fan = line.substring(4).trim();

            } else if (line.startsWith("Light=")) {

                lightAction = line.substring(6).trim();

            } else if (line.startsWith("Projector=")) {

                projector = line.substring(10).trim();

            } else if (line.startsWith("Reason=")) {

                reason = line.substring(7).trim();
            }
        }

        return saveDecision(
                temp,
                hum,
                light,
                aq,
                motion,
                fan,
                lightAction,
                projector,
                reason
        );
    }

    private AiDecision saveDecision(Double temp,
                                    Double hum,
                                    Integer light,
                                    Integer aq,
                                    Boolean motion,
                                    String fan,
                                    String lightAction,
                                    String projector,
                                    String reason) {

        AiDecision decision = AiDecision.builder()
                .temperature(temp)
                .humidity(hum)
                .light(light)
                .airQuality(aq)
                .motion(motion)
                .fan(fan)
                .lightAction(lightAction)
                .projector(projector)
                .reason(reason)
                .build();

        return aiDecisionRepository.save(decision);
    }
}