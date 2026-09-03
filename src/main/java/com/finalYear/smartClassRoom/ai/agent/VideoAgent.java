package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * VideoAgent — recommends learning videos.
 * Future: integrate YouTube Data API or curated video DB.
 */
@Component
public class VideoAgent extends BaseAgent {

    // Curated video recommendations per subject
    private static final Map<String, List<AgentResponse.VideoRecommendation>> VIDEO_DB = Map.of(
        "java", List.of(
            new AgentResponse.VideoRecommendation("Java Full Course - Programming with Mosh", "https://www.youtube.com/watch?v=eIrMbAQSU34", "", "5:08:00"),
            new AgentResponse.VideoRecommendation("Java Tutorial for Beginners", "https://www.youtube.com/watch?v=grEKMHGYyns", "", "2:30:00")
        ),
        "python", List.of(
            new AgentResponse.VideoRecommendation("Python for Beginners - Mosh", "https://www.youtube.com/watch?v=_uQrJ0TkZlc", "", "6:14:00"),
            new AgentResponse.VideoRecommendation("Python Full Course freeCodeCamp", "https://www.youtube.com/watch?v=rfscVS0vtbw", "", "4:26:00")
        ),
        "data structures", List.of(
            new AgentResponse.VideoRecommendation("Data Structures - CS50", "https://www.youtube.com/watch?v=0euvEdPwQnQ", "", "1:30:00"),
            new AgentResponse.VideoRecommendation("Data Structures Full Course", "https://www.youtube.com/watch?v=RBSGKlAvoiM", "", "7:53:00")
        ),
        "machine learning", List.of(
            new AgentResponse.VideoRecommendation("Machine Learning Course - Stanford", "https://www.youtube.com/watch?v=jGwO_UgTS7I", "", "3:00:00"),
            new AgentResponse.VideoRecommendation("ML Full Course freeCodeCamp", "https://www.youtube.com/watch?v=NWONeJKn9Kc", "", "9:52:00")
        ),
        "dbms", List.of(
            new AgentResponse.VideoRecommendation("DBMS Full Course", "https://www.youtube.com/watch?v=kBdlM6hNDAE", "", "4:20:00"),
            new AgentResponse.VideoRecommendation("SQL Tutorial - freeCodeCamp", "https://www.youtube.com/watch?v=HXV3zeQKqGY", "", "4:20:00")
        )
    );

    @Override
    public AgentResponse handle(AgentRequest request) {
        String subject = extractSubject(request.getPrompt());
        List<AgentResponse.VideoRecommendation> videos = VIDEO_DB.getOrDefault(
            subject.toLowerCase(),
            List.of(
                new AgentResponse.VideoRecommendation(
                    "CS50 - Introduction to Computer Science",
                    "https://www.youtube.com/watch?v=8mAITcNt710", "", "2:00:00"
                )
            )
        );

        String answer = "Here are recommended videos for learning " + subject + ":";

        // Also try Ollama for a personalised recommendation message
        String ollama = callOllama(
            "You are a learning resource advisor. Suggest what to focus on when studying " + subject + ". Be brief (2-3 sentences).",
            request.getPrompt()
        );
        if (ollama != null) answer = ollama + "\n\nRecommended videos:";

        return AgentResponse.builder()
            .answer(answer).agentName(agentName())
            .ollamaGenerated(ollama != null)
            .videos(videos)
            .followUpQuestions(List.of(
                "Explain " + subject + " in detail",
                "Generate a quiz on " + subject,
                "What are the key concepts of " + subject + "?"
            )).build();
    }

    private String extractSubject(String prompt) {
        String p = prompt.toLowerCase();
        if (p.contains("java"))            return "Java";
        if (p.contains("python"))          return "Python";
        if (p.contains("data structure"))  return "Data Structures";
        if (p.contains("machine learn"))   return "Machine Learning";
        if (p.contains("dbms") || p.contains("database")) return "DBMS";
        if (p.contains("network"))         return "Computer Networks";
        if (p.contains("algorithm"))       return "Data Structures";
        return "Computer Science";
    }

    @Override protected String agentName() { return "VideoAgent"; }
}
