package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.entity.AuditLog;
import com.finalYear.smartClassRoom.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API for browsing the audit log.
 * Only SUPER_ADMIN and ADMIN can access these endpoints.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /**
     * GET /api/audit-logs
     * Returns all audit log entries, most recent first.
     * Supports ?page=0&size=20 pagination.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> getAuditLogs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<AuditLogDto> result = auditLogRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(AuditLogDto::from);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/audit-logs/search?action=USER_DELETED
     * Filters entries by action keyword.
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Page<AuditLogDto>> searchByAction(
            @RequestParam String action,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<AuditLogDto> result = auditLogRepository
                .findByActionContainingIgnoreCaseOrderByCreatedAtDesc(action, pageable)
                .map(AuditLogDto::from);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/audit-logs/stats
     * Returns quick summary counts by action for the dashboard.
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<Map<String, Long>> getStats() {
        long total   = auditLogRepository.count();
        return ResponseEntity.ok(Map.of("total", total));
    }

    // ── Inner projection DTO ─────────────────────────────────────────────────
    public record AuditLogDto(
            Long   id,
            String userEmail,
            String userRole,
            String action,
            String entityType,
            Long   entityId,
            String details,
            String ipAddress,
            String status,
            String createdAt
    ) {
        static AuditLogDto from(AuditLog log) {
            return new AuditLogDto(
                    log.getId(),
                    log.getUserEmail(),
                    log.getUserRole() != null ? log.getUserRole().name() : null,
                    log.getAction(),
                    log.getEntityType(),
                    log.getEntityId(),
                    log.getDetails(),
                    log.getIpAddress(),
                    log.getStatus() != null ? log.getStatus().name() : null,
                    log.getCreatedAt() != null ? log.getCreatedAt().toString() : null
            );
        }
    }
}
