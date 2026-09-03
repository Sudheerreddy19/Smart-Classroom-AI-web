package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;

    private Long userId;

    private String title;

    private String message;

    private Notification.NotificationType type;

    private boolean read;

    private String targetRole;

    private LocalDateTime createdAt;
}