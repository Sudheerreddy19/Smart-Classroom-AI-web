package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.AISession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISessionResponse {

    private Long id;

    private String title;

    private AISession.SessionType sessionType;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<AIQueryResponse> queries;
}