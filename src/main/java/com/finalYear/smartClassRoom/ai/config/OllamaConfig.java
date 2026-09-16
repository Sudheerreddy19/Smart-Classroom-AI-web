package com.finalYear.smartClassRoom.ai.config;

import dev.langchain4j.model.ollama.OllamaChatModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Configuration
public class OllamaConfig {

    private static final Logger log = LoggerFactory.getLogger(OllamaConfig.class);

    @Bean
    public OllamaChatModel ollamaChatModel(

            @Value("${OLLAMA_BASE_URL:${spring.ai.ollama.base-url:http://ollama.railway.internal:11434}}")
            String baseUrl,

            @Value("${spring.ai.ollama.chat.options.model:${OLLAMA_MODEL:llama3.2:3b}}")
            String model

    ) {

        System.out.println("================================");
        System.out.println("Using Ollama");
        System.out.println("Base URL : " + baseUrl);
        System.out.println("Model    : " + model);
        System.out.println("================================");

        try {

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(4))
                    .build();

            // ---------------------------------------------------------
            // Check available models with timeout
            // ---------------------------------------------------------
            HttpRequest tagsRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/tags"))
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> tagsResponse =
                    client.send(tagsRequest, HttpResponse.BodyHandlers.ofString());

            System.out.println("================================");
            System.out.println("OLLAMA TAGS:");
            System.out.println(tagsResponse.body());
            System.out.println("CONFIG MODEL = " + model);
            System.out.println("================================");

            // ---------------------------------------------------------
            // Test chat API
            // ---------------------------------------------------------
            String body = """
                    {
                      "model":"%s",
                      "messages":[
                        {
                          "role":"user",
                          "content":"Say Hello"
                        }
                      ],
                      "stream":false
                    }
                    """.formatted(model);

            HttpRequest chatRequest =
                    HttpRequest.newBuilder()
                            .uri(URI.create(baseUrl + "/api/chat"))
                            .timeout(Duration.ofSeconds(6))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(body))
                            .build();

            HttpResponse<String> chatResponse =
                    client.send(chatRequest,
                            HttpResponse.BodyHandlers.ofString());

            System.out.println("================================");
            System.out.println("CHAT STATUS = " + chatResponse.statusCode());
            System.out.println("CHAT BODY   = ");
            System.out.println(chatResponse.body());
            System.out.println("================================");

        } catch (Exception e) {
            System.out.println("================================");
            System.out.println("OLLAMA CONNECTION NOTICE: " + e.getMessage());
            System.out.println("Base URL tested: " + baseUrl);
            System.out.println("Smart AI Classroom backend will continue starting normally.");
            System.out.println("AI requests will connect dynamically once Ollama is available.");
            System.out.println("================================");
            log.warn("Ollama is currently unreachable at {}: {}. Backend startup continuing.", baseUrl, e.getMessage());
        }

        return OllamaChatModel.builder()
                .baseUrl(baseUrl)
                .modelName(model)
                .temperature(0.7)
                .timeout(Duration.ofMinutes(2))
                .build();
    }
}