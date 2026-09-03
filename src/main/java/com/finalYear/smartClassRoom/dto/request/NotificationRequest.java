package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.*;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private Notification.NotificationType type = Notification.NotificationType.INFO;


    private Long userId;

    private User.Role targetRole;
}