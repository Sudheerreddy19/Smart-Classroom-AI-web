package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser(User user);

    List<Notification> findByUserAndReadFalse(User user);

    List<Notification> findByTargetRole(User.Role role);

    List<Notification> findByReadFalse();

    long countByUserAndReadFalse(User user);
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

}