package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.AttendanceSessionRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * AttendanceAgent — queries PostgreSQL for real attendance data,
 * then uses Ollama to generate a natural-language analysis.
 * Does NOT let the LLM guess DB values.
 */
@Component
@RequiredArgsConstructor
public class AttendanceAgent extends BaseAgent {

    private final AttendanceSessionRepository sessionRepository;
    private final StudentRepository           studentRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        User.Role role   = request.getRole();
        String    prompt = request.getPrompt().toLowerCase();

        // ── Fetch real data from DB ────────────────────────────────────────────
        long totalSessions  = sessionRepository.count();
        long totalStudents  = studentRepository.count();
        double avgRate      = sessionRepository.getAverageAttendanceRate();
        long todaySessions  = sessionRepository.countTodaySessions();

        // Build a data-grounded context
        String dataContext = String.format(
            "Real attendance data from database: " +
            "Total sessions recorded: %d, Total students: %d, " +
            "Average attendance rate: %.1f%%, Today's sessions: %d.",
            totalSessions, totalStudents, avgRate, todaySessions
        );

        // Student asking about their own attendance
        if (role == User.Role.STUDENT) {
            String answer = "Your attendance records are available in the Attendance section. " +
                "The institution currently has an average attendance rate of " + String.format("%.1f%%", avgRate) + ". " +
                "Check the Attendance tab in the sidebar to see your subject-wise attendance percentage.";
            return AgentResponse.builder()
                .answer(answer).agentName(agentName())
                .data(Map.of("avgRate", avgRate, "todaySessions", todaySessions))
                .followUpQuestions(java.util.List.of(
                    "Which subject has my lowest attendance?",
                    "Am I at risk of attendance shortage?",
                    "Show my attendance trend this month"
                ))
                .build();
        }

        // Staff — try Ollama with real DB data as context
        String systemPrompt = """
            You are an AI analytics assistant for a Smart Classroom system.
            You have access to real attendance data from the database.
            Use the provided data to give accurate, helpful analysis.
            Be concise and data-driven.
            """;
        String fullPrompt = dataContext + "\n\nAnalysis request: " + request.getPrompt();
        String ollamaAnswer = callOllama(systemPrompt, fullPrompt);

        if (ollamaAnswer != null) {
            return AgentResponse.builder()
                .answer(ollamaAnswer).agentName(agentName())
                .ollamaGenerated(true)
                .data(Map.of("avgRate", avgRate, "totalSessions", totalSessions, "todaySessions", todaySessions))
                .build();
        }

        // Fallback with real DB data
        String fallback = String.format(
            "Current attendance summary:\n" +
            "• Total sessions recorded: %d\n" +
            "• Total students enrolled: %d\n" +
            "• Average attendance rate: %.1f%%\n" +
            "• Today's active sessions: %d\n\n" +
            "Visit the Attendance section for detailed reports and subject-wise breakdowns.",
            totalSessions, totalStudents, avgRate, todaySessions
        );
        return AgentResponse.builder()
            .answer(fallback).agentName(agentName())
            .data(Map.of("avgRate", avgRate, "totalStudents", totalStudents))
            .build();
    }

    @Override protected String agentName() { return "AttendanceAgent"; }
}
