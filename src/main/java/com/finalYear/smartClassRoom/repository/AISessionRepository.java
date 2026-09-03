package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AISessionRepository extends JpaRepository<AISession, Long> {

    Page<AISession> findByUser(User user, Pageable pageable);

    List<AISession> findByUserOrderByUpdatedAtDesc(User user);

    List<AISession> findBySessionType(AISession.SessionType sessionType);

    // ── Used when permanently deleting a user ─────────────────────────────────
    @Modifying
    @Transactional
    @Query("DELETE FROM AISession s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}