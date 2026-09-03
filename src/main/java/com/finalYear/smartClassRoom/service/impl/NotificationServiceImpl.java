package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.NotificationRequest;
import com.finalYear.smartClassRoom.dto.response.NotificationResponse;
import com.finalYear.smartClassRoom.entity.Notification;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.NotificationRepository;
import com.finalYear.smartClassRoom.repository.UserRepository;
import com.finalYear.smartClassRoom.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public NotificationResponse create(NotificationRequest request) {

        User user = null;

        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("User", request.getUserId()));
        }

        Notification notification = Notification.builder()
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType())
                .user(user)
                .targetRole(request.getTargetRole())
                .read(false)
                .build();

        return toResponse(notificationRepository.save(notification));
    }

    @Override
    public Page<NotificationResponse> getUserNotifications(Long userId, Pageable pageable) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        return notificationRepository
                .findByUserOrderByCreatedAtDesc(user, pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        notificationRepository.findByUserOrderByCreatedAtDesc(user, Pageable.unpaged())
                .forEach(notification -> {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                });
    }

    @Override
    public long getUnreadCount(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", userId));

        return notificationRepository.countByUserAndReadFalse(user);
    }

    private NotificationResponse toResponse(Notification notification) {

        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}