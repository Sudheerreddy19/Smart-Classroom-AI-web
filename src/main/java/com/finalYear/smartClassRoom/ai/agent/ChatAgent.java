package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.ai.prompt.PromptProvider;
import com.finalYear.smartClassRoom.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ChatAgent extends BaseAgent {

    @Autowired
    private PromptProvider promptProvider;

    @Override
    public AgentResponse handle(AgentRequest request) {

        String systemPrompt = promptProvider.getPrompt(request.getRole());

        String response = callOllama(systemPrompt, request.getPrompt());

        if (response != null && !response.isBlank()) {
            return AgentResponse.ollama(response, agentName());
        }

        return AgentResponse.text(
                "Sorry, I couldn't connect to the AI model.",
                agentName()
        );
    }

    @Override
    protected String agentName() {
        return "ChatAgent";
    }
}