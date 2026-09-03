package com.finalYear.smartClassRoom.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class CleanupScheduler {

    @Scheduled(cron = "0 0 2 * * *")
    public void cleanup() {

        log.info("Running cleanup task...");
    }
}