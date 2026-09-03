package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.entity.AuditLog;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.AuditLogRepository;
import com.finalYear.smartClassRoom.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    /**
     * Log an action asynchronously (non-blocking).
     */
    @Async
    public void log(String action, String entityType, Long entityId, String details) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            User.Role role = null;
            String email = null;

            if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
                email = auth.getName();
                user = userRepository.findByEmail(email).orElse(null);
                if (user != null) role = user.getRole();
            }

            AuditLog entry = AuditLog.builder()
                    .user(user)
                    .userEmail(email)
                    .userRole(role)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .details(details)
                    .ipAddress(resolveIpAddress())
                    .status(AuditLog.AuditStatus.SUCCESS)
                    .build();

            auditLogRepository.save(entry);
        } catch (DataAccessException e) {
            log.warn("Audit log failed for action {}: {}", action, e.getMessage());
            log.debug("Audit log exception detail", e);
        }
    }

    @Async
    public void logFailure(String action, String details) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (auth != null) ? auth.getName() : "unknown";

            AuditLog entry = AuditLog.builder()
                    .userEmail(email)
                    .action(action)
                    .details(details)
                    .ipAddress(resolveIpAddress())
                    .status(AuditLog.AuditStatus.FAILURE)
                    .build();

            auditLogRepository.save(entry);
        } catch (DataAccessException e) {
            log.warn("Audit log failure entry failed: {}", e.getMessage());
            log.debug("Audit log failure exception detail", e);
        }
    }

    private String resolveIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs == null) return "unknown";
            HttpServletRequest request = attrs.getRequest();
            String forwarded = request.getHeader("X-Forwarded-For");
            return (forwarded != null && !forwarded.isBlank())
                    ? forwarded.split(",")[0].trim()
                    : request.getRemoteAddr();
        } catch (IllegalStateException e) {
            log.debug("Could not resolve IP address: {}", e.getMessage());
            return "unknown";
        }
    }
}
