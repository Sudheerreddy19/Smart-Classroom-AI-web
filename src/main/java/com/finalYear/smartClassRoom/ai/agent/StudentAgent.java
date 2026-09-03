package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class StudentAgent extends BaseAgent {

    private final StudentRepository studentRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        long total  = studentRepository.count();
        long active = studentRepository.findByActiveTrue().size();

        String dataCtx = String.format("Student data: %d total, %d active students.", total, active);
        String ollama  = callOllama(
            "You are a student analytics assistant. Use real DB data to answer. Be concise.",
            dataCtx + " Request: " + request.getPrompt()
        );
        if (ollama != null) {
            return AgentResponse.builder().answer(ollama).agentName(agentName())
                .ollamaGenerated(true).data(Map.of("total", total, "active", active)).build();
        }

        return AgentResponse.builder()
            .answer(String.format("Student overview: %d total students enrolled, %d currently active. " +
                "Visit the Students section for detailed profiles, attendance, and performance data.", total, active))
            .agentName(agentName())
            .data(Map.of("total", total, "active", active)).build();
    }

    @Override protected String agentName() { return "StudentAgent"; }
}
