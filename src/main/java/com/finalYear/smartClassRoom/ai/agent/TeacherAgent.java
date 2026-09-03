package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeacherAgent extends BaseAgent {

    private final TeacherRepository teacherRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        long total  = teacherRepository.count();
        long active = teacherRepository.findByActiveTrue(Pageable.unpaged()).getTotalElements();

        String dataCtx = String.format("Teacher data: %d total, %d active teachers.", total, active);
        String ollama  = callOllama(
            "You are a faculty analytics assistant. Use real data. Be concise.",
            dataCtx + " Request: " + request.getPrompt()
        );
        if (ollama != null) return AgentResponse.ollama(ollama, agentName());

        return AgentResponse.text(
            String.format("Faculty overview: %d total teachers, %d currently active. " +
                "Visit the Teachers section for assignments, subjects, and performance.", total, active),
            agentName()
        );
    }

    @Override protected String agentName() { return "TeacherAgent"; }
}
