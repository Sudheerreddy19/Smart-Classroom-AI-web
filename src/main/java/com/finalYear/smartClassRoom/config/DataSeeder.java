package com.finalYear.smartClassRoom.config;

import com.finalYear.smartClassRoom.entity.*;
import com.finalYear.smartClassRoom.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds only the SUPER_ADMIN account on first startup.
 * All other users (ADMIN, HOD, TEACHER, STUDENT) are created
 * through the application UI by authorised users.
 *
 * Students can self-register via /register.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository      userRepository;
    private final ClassroomRepository classroomRepository;
    private final PasswordEncoder     passwordEncoder;

    private static final String SUPER_ADMIN_EMAIL = "byreddy19sudheer@gmail.com";

    @Override
    @Transactional
    public void run(String... args) {
        seedSuperAdmin();
        seedDefaultClassrooms();
    }

    // ── Super Admin ───────────────────────────────────────────────────────────
    private void seedSuperAdmin() {
        if (userRepository.existsByEmail(SUPER_ADMIN_EMAIL)) {
            // Already exists — ensure role is correct (upgrade if old seed ran)
            userRepository.findByEmail(SUPER_ADMIN_EMAIL).ifPresent(u -> {
                if (u.getRole() != User.Role.SUPER_ADMIN) {
                    u.setRole(User.Role.SUPER_ADMIN);
                    u.setEnabled(true);
                    u.setEmailVerified(true);
                    userRepository.save(u);
                    log.info("Upgraded {} to SUPER_ADMIN", SUPER_ADMIN_EMAIL);
                }
            });
            return;
        }

        userRepository.save(User.builder()
                .firstName("Sudheer")
                .lastName("Byreddy")
                .email(SUPER_ADMIN_EMAIL)
                .password(passwordEncoder.encode("23FE1A0424@s"))
                .role(User.Role.SUPER_ADMIN)
                .enabled(true)
                .emailVerified(true)
                .build());

        log.info("SUPER_ADMIN account created: {}", SUPER_ADMIN_EMAIL);
    }

    // ── Default classrooms (needed for attendance sessions) ──────────────────
    private void seedDefaultClassrooms() {
        if (classroomRepository.existsByRoomNumber("Room 101")) return;

        classroomRepository.save(Classroom.builder()
                .roomNumber("Room 101").capacity(60).active(true)
                .cameraId("CAM-101").esp32Id("ESP32-101").projectorId("PROJ-101")
                .build());
        classroomRepository.save(Classroom.builder()
                .roomNumber("Room 102").capacity(60).active(true).build());
        classroomRepository.save(Classroom.builder()
                .roomNumber("Computer Lab 1").capacity(40).active(true)
                .esp32Id("ESP32-LAB1").build());
        classroomRepository.save(Classroom.builder()
                .roomNumber("Seminar Hall").capacity(120).active(true).build());

        log.info("Default classrooms created.");
    }
}
