package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface AIQueryRepository extends JpaRepository<AIQuery, Long> {

    List<AIQuery> findBySession(AISession session);

    List<AIQuery> findBySessionOrderByCreatedAtAsc(AISession session);

    List<AIQuery> findByQueryType(AIQuery.QueryType queryType);

    // ── Used when permanently deleting a user (delete queries before sessions) ─
    @Modifying
    @Transactional
    @Query("DELETE FROM AIQuery q WHERE q.session.user.id = :userId")
    void deleteBySessionUserId(@Param("userId") Long userId);
}