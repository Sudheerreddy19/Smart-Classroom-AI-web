package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.AIQuery;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AIQueryRequest {


    private Long sessionId;

    @NotBlank(message = "Prompt is required")
    private String prompt;

    private AIQuery.QueryType queryType = AIQuery.QueryType.GENERAL;


    private String subjectContext;


    private String sessionTitle;
}