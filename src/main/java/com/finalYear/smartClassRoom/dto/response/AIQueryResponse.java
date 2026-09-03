package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.AIQuery;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIQueryResponse {

    private Long id;

    private Long sessionId;

    private String prompt;

    private String response;

    private AIQuery.QueryType queryType;

    private String subjectContext;

    private Integer tokensUsed;

    private LocalDateTime createdAt;
}