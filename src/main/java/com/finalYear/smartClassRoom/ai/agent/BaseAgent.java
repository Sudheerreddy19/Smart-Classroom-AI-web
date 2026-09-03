package com.finalYear.smartClassRoom.ai.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class BaseAgent {

    private final ObjectMapper mapper = new ObjectMapper();

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    protected String callOllama(String systemPrompt, String userPrompt) {

        try {

            Map<String, Object> body = Map.of(

                    "model", "llama3.2:3b",

                    "stream", false,

                    "options", Map.of(
                            "temperature", 0.3,
                            "num_predict", 300
                    ),

                    "messages", List.of(

                            Map.of(
                                    "role", "system",
                                    "content", systemPrompt
                            ),

                            Map.of(
                                    "role", "user",
                                    "content", userPrompt
                            )
                    )
            );

            HttpRequest request =
                    HttpRequest.newBuilder()
                            .uri(URI.create("http://localhost:11434/api/chat"))
                            .timeout(Duration.ofSeconds(45))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                            .build();

            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString());

            JsonNode root = mapper.readTree(response.body());

            if (root.has("error")) {
                return "";
            }

            return root.path("message")
                    .path("content")
                    .asText("")
                    .trim();

        } catch (Exception ex) {

            log.error("Ollama Error", ex);

            return "";
        }

    }

    public abstract AgentResponse handle(AgentRequest request);

    protected abstract String agentName();
}