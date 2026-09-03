package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.NotificationRequest;
import com.finalYear.smartClassRoom.dto.response.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    NotificationResponse create(NotificationRequest request);

    Page<NotificationResponse> getUserNotifications(Long userId,
                                                    Pageable pageable);

    void markAllAsRead(Long userId);

    long getUnreadCount(Long userId);


}