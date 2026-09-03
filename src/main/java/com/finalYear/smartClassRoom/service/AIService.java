package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.AIQueryRequest;
import com.finalYear.smartClassRoom.dto.response.AIQueryResponse;
import com.finalYear.smartClassRoom.dto.response.AISessionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AIService {

    AIQueryResponse processQuery(Long userId,
                                 AIQueryRequest request);

    AISessionResponse getSession(Long sessionId);

    Page<AISessionResponse> getUserSessions(Long userId,
                                            Pageable pageable);

    void deleteSession(Long sessionId);

    Page<AISessionResponse> getSessions(Pageable pageable);
}