package com.finalYear.smartClassRoom.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationScheduler {

    @Scheduled(cron = "0 0 18 * * *")
    public void sendDailySummary() {

        log.info("Sending daily attendance summary...");
    }
}