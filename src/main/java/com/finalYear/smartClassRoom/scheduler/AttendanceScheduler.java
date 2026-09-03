package com.finalYear.smartClassRoom.scheduler;

import com.finalYear.smartClassRoom.entity.AttendanceSession;
import com.finalYear.smartClassRoom.repository.AttendanceSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class AttendanceScheduler {

    private final AttendanceSessionRepository attendanceSessionRepository;

    @Scheduled(fixedRate = 60000) // Every minute
    public void closeExpiredSessions() {

        attendanceSessionRepository.findAll()
                .stream()
                .filter(session ->
                        session.getStatus() == AttendanceSession.SessionStatus.ACTIVE
                                && session.getSessionDate().equals(LocalDate.now())
                                && session.getEndTime() != null
                                && session.getEndTime().isBefore(LocalTime.now()))
                .forEach(session -> {

                    session.setStatus(AttendanceSession.SessionStatus.COMPLETED);

                    attendanceSessionRepository.save(session);

                    log.info("Attendance Session {} completed automatically.",
                            session.getId());
                });
    }
}