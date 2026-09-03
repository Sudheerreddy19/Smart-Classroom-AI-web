package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles the complete, ordered deletion of a User account and ALL
 * dependent data. Must be called AFTER the Teacher/Student profile
 * rows have already been deleted (since they have NOT NULL FK to users).
 *
 * Deletion order (FK dependency graph, leaves first):
 *   AIQuery -> AISession -> RefreshToken -> Notification -> AuditLog -> User
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserDeletionService {

    private final AIQueryRepository      aiQueryRepository;
    private final AISessionRepository    aiSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository     auditLogRepository;
    private final UserRepository         userRepository;

    /**
     * Permanently deletes the given User and all related records.
     * Call this AFTER the Teacher/Student profile rows are deleted.
     */
    @Transactional
    public void deleteUser(User user) {
        Long uid = user.getId();
        String email = user.getEmail();

        // 1. AIQuery rows (child of AISession - must go first)
        aiQueryRepository.deleteBySessionUserId(uid);

        // 2. AISession rows
        aiSessionRepository.deleteByUserId(uid);

        // 3. RefreshToken rows (login sessions)
        refreshTokenRepository.deleteByUser(user);

        // 4. Notification rows
        notificationRepository.deleteByUserId(uid);

        // 5. AuditLog rows
        auditLogRepository.deleteByUserId(uid);

        // 6. Finally delete the User row itself
        userRepository.deleteById(uid);

        log.info("[UserDeletion] Permanently deleted user id={} email={}", uid, email);
    }
}
