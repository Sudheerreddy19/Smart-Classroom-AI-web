package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.entity.Classroom;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.repository.ClassroomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

/**
 * Handles automatic classroom assignment for students.
 *
 * Naming convention: {DEPT_CODE}-A, {DEPT_CODE}-B, {DEPT_CODE}-C ...
 * e.g.  CSE-A (first 60 students), CSE-B (next 60), ECE-A, ECE-B ...
 *
 * When a student is created, this service:
 *   1. Finds all classrooms for the department (prefix = dept code + "-")
 *   2. Picks the last one that still has free capacity
 *   3. If all are full (or none exist), creates the next classroom automatically
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClassroomAutoAssignService {

    private final ClassroomRepository classroomRepository;

    @Value("${classroom.default-capacity:60}")
    private int defaultCapacity;

    private static final String LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    /**
     * Find or create a classroom for the given department and return it.
     * Thread-safe: synchronized on dept code string for simple safety under load.
     */
    @Transactional
    public synchronized Classroom assignClassroom(Department department) {
        String deptCode = buildDeptCode(department);
        String prefix   = deptCode + "-";

        List<Classroom> existing = classroomRepository
                .findByRoomNumberStartingWithAndActiveTrue(prefix);

        // Sort by room name: CSE-A, CSE-B, CSE-C ...
        existing.sort(Comparator.comparing(Classroom::getRoomNumber));

        for (Classroom room : existing) {
            long count = classroomRepository.countStudentsByClassroomId(room.getId());
            if (count < defaultCapacity) {
                log.debug("Assigning student to existing classroom {} ({}/{})", room.getRoomNumber(), count, defaultCapacity);
                return room;
            }
        }

        // All full — create next classroom
        String nextLetter = nextLetter(existing.size());
        String roomNumber  = prefix + nextLetter;
        Classroom newRoom  = Classroom.builder()
                .roomNumber(roomNumber)
                .capacity(defaultCapacity)
                .active(true)
                .build();
        newRoom = classroomRepository.save(newRoom);
        log.info("Auto-created classroom {} for department {}", roomNumber, deptCode);
        return newRoom;
    }

    /** Compute capacity report for all dept-auto classrooms */
    @Transactional(readOnly = true)
    public List<ClassroomCapacityEntry> getCapacityReport() {
        return classroomRepository.findByActiveTrue().stream()
                .filter(c -> c.getRoomNumber().matches("[A-Z]+-[A-Z]+"))
                .sorted(Comparator.comparing(Classroom::getRoomNumber))
                .map(room -> {
                    long used = classroomRepository.countStudentsByClassroomId(room.getId());
                    return new ClassroomCapacityEntry(
                            room.getId(),
                            room.getRoomNumber(),
                            room.getCapacity(),
                            (int) used,
                            room.getCapacity() - (int) used,
                            room.getCapacity() > 0
                                ? Math.round((used * 100.0 / room.getCapacity()) * 10) / 10.0
                                : 0.0
                    );
                })
                .toList();
    }

    /** Adjust capacity of all dept classrooms to the average (total / rooms) */
    @Transactional
    public String adjustCapacity(String deptCode) {
        String prefix = deptCode.toUpperCase() + "-";
        List<Classroom> rooms = classroomRepository
                .findByRoomNumberStartingWithAndActiveTrue(prefix);
        if (rooms.isEmpty()) return "No classrooms found for " + deptCode;

        long totalStudents = rooms.stream()
                .mapToLong(r -> classroomRepository.countStudentsByClassroomId(r.getId()))
                .sum();
        int avgCapacity = (int) Math.ceil((double) totalStudents / rooms.size());
        if (avgCapacity < 1) avgCapacity = defaultCapacity;

        int finalCap = avgCapacity;
        rooms.forEach(r -> { r.setCapacity(finalCap); classroomRepository.save(r); });
        log.info("Adjusted capacity of {} classrooms for {} to {}", rooms.size(), deptCode, avgCapacity);
        return "Adjusted " + rooms.size() + " classrooms for " + deptCode +
               " — new capacity: " + avgCapacity + " (total students: " + totalStudents + ")";
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String buildDeptCode(Department dept) {
        String name = dept.getCode() != null && !dept.getCode().isBlank()
                ? dept.getCode()
                : dept.getName();
        // Take first letters of each word: "Computer Science Engineering" -> "CSE"
        String[] words = name.trim().split("\\s+");
        if (words.length == 1) {
            return words[0].toUpperCase().substring(0, Math.min(3, words[0].length()));
        }
        StringBuilder sb = new StringBuilder();
        for (String w : words) if (!w.isEmpty()) sb.append(Character.toUpperCase(w.charAt(0)));
        return sb.toString();
    }

    private String nextLetter(int existingCount) {
        if (existingCount < LETTERS.length()) return String.valueOf(LETTERS.charAt(existingCount));
        // Beyond Z: AA, AB ...
        int first  = (existingCount / LETTERS.length()) - 1;
        int second = existingCount % LETTERS.length();
        return String.valueOf(LETTERS.charAt(first)) + LETTERS.charAt(second);
    }

    // ── Inner record ──────────────────────────────────────────────────────────

    public record ClassroomCapacityEntry(
            Long   id,
            String roomNumber,
            int    capacity,
            int    used,
            int    free,
            double fillPercent
    ) {}
}