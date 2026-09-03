package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.UserActivityLog;
import com.finalYear.smartClassRoom.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserActivityLogRepository extends JpaRepository<UserActivityLog, Long> {

    Page<UserActivityLog> findByActorId(Long actorId, Pageable pageable);

    Page<UserActivityLog> findByTargetUserId(Long targetUserId, Pageable pageable);

    Page<UserActivityLog> findByActorRole(User.Role actorRole, Pageable pageable);

    Page<UserActivityLog> findByOperation(UserActivityLog.Operation operation, Pageable pageable);
}
