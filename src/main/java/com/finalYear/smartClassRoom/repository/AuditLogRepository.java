package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.AuditLog;
import com.finalYear.smartClassRoom.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    Page<AuditLog> findByActionContainingIgnoreCaseOrderByCreatedAtDesc(String action, Pageable pageable);
    List<AuditLog> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // ── Used when permanently deleting a user ─────────────────────────────────
    @Modifying
    @Transactional
    @Query("DELETE FROM AuditLog a WHERE a.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
