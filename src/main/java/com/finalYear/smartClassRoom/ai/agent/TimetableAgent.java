package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TimetableAgent extends BaseAgent {

    private final TimetableRepository timetableRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        long total = timetableRepository.count();
        String prompt = request.getPrompt();

        String ollama = callOllama(
            "You are a timetable assistant for a Smart Classroom. Help with schedule queries. Be brief.",
            "Timetable has " + total + " entries. Request: " + prompt
        );
        if (ollama != null) return AgentResponse.ollama(ollama, agentName());

        return AgentResponse.text(
            "Your timetable is available in the Timetable section. " +
            "It shows your weekly class schedule with subjects, teachers, and room assignments. " +
            "The system currently has " + total + " scheduled classes.",
            agentName()
        );
    }

    @Override protected String agentName() { return "TimetableAgent"; }
}
