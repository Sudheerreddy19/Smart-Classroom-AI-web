package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * QuizAgent — generates MCQ quizzes using Ollama.
 * Future: persist quizzes in DB and assign to students.
 */
@Component
public class QuizAgent extends BaseAgent {

    @Override
    public AgentResponse handle(AgentRequest request) {
        String subject = request.getSubjectContext() != null
            ? request.getSubjectContext()
            : extractSubject(request.getPrompt());

        String systemPrompt = """
            You are a quiz generator for a Smart Classroom.
            Generate 5 multiple-choice questions on the given topic.
            Format each question exactly as:
            Q1. [Question]
            A) [Option]
            B) [Option]
            C) [Option]
            D) [Option]
            Answer: [Letter]
            
            Make questions appropriate for university-level students.
            """;

        String ollama = callOllama(systemPrompt,
            "Generate a quiz on: " + subject + ". Topic from request: " + request.getPrompt());

        if (ollama != null) {
            return AgentResponse.builder()
                .answer(ollama).agentName(agentName())
                .ollamaGenerated(true)
                .followUpQuestions(List.of(
                    "Generate harder questions on " + subject,
                    "Explain the answer to question 1",
                    "Generate a quiz on a related topic"
                )).build();
        }

        return AgentResponse.text(
            "Quiz generation requires Ollama (llama3.2) to be running. " +
            "Once connected, I can generate MCQ quizzes on " + subject + " and any other subject. " +
            "Please ensure Ollama is running at http://localhost:11434",
            agentName()
        );
    }

    private String extractSubject(String prompt) {
        String p = prompt.toLowerCase();
        if (p.contains("java"))          return "Java Programming";
        if (p.contains("python"))        return "Python Programming";
        if (p.contains("data structure")) return "Data Structures";
        if (p.contains("algorithm"))     return "Algorithms";
        if (p.contains("dbms") || p.contains("database")) return "Database Management Systems";
        if (p.contains("network"))       return "Computer Networks";
        if (p.contains("os") || p.contains("operating")) return "Operating Systems";
        if (p.contains("machine learn")) return "Machine Learning";
        if (p.contains("ai") || p.contains("artificial")) return "Artificial Intelligence";
        return "Computer Science";
    }

    @Override protected String agentName() { return "QuizAgent"; }
}
