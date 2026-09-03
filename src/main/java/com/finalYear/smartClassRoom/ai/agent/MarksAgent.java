package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.MarksRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * MarksAgent — fetches real marks from DB, uses Ollama for analysis.
 */
@Component
@RequiredArgsConstructor
public class MarksAgent extends BaseAgent {

    private final MarksRepository marksRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        long totalRecords = marksRepository.count();

        if (request.getRole() == User.Role.STUDENT) {
            return AgentResponse.text(
                "Your marks and grades are available in the Exams & Marks section in the sidebar. " +
                "You can view your subject-wise scores, grades, and performance trends there. " +
                "The system currently has " + totalRecords + " marks records across all subjects.",
                agentName()
            );
        }

        // Staff — AI-powered analysis
        String dataCtx = "Real marks data: " + totalRecords + " marks records in the system.";
        String ollama  = callOllama(
            "You are an academic analytics assistant. Analyse marks and performance data. Be concise.",
            dataCtx + " Request: " + request.getPrompt()
        );
        if (ollama != null) return AgentResponse.ollama(ollama, agentName());

        return AgentResponse.text(
            "Marks summary: " + totalRecords + " records in the database. " +
            "Visit the Exams & Marks section for detailed grade distribution and performance analytics.",
            agentName()
        );
    }

    @Override protected String agentName() { return "MarksAgent"; }
}
