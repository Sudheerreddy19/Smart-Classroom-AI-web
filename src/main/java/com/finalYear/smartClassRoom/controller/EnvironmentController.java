package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.response.EnvironmentResponse;
import com.finalYear.smartClassRoom.entity.Classroom;
import com.finalYear.smartClassRoom.entity.EnvironmentData;
import com.finalYear.smartClassRoom.repository.ClassroomRepository;
import com.finalYear.smartClassRoom.repository.EnvironmentDataRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/environment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EnvironmentController {

    private final EnvironmentDataRepository environmentDataRepository;
    private final ClassroomRepository classroomRepository;

    /** Latest reading for every classroom */
    @GetMapping("/latest")
    public ResponseEntity<List<EnvironmentResponse>> getAllLatest() {
        List<Classroom> classrooms = classroomRepository.findByActiveTrue();
        List<EnvironmentResponse> results = classrooms.stream()
                .map(c -> {
                    EnvironmentData data = environmentDataRepository
                            .findTopByClassroomOrderByRecordedAtDesc(c);
                    return toResponse(c, data);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(results);
    }

    /** Latest reading for a specific classroom */
    @GetMapping("/latest/{classroomId}")
    public ResponseEntity<EnvironmentResponse> getLatest(@PathVariable Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new com.finalYear.smartClassRoom.exception
                        .ResourceNotFoundException("Classroom", classroomId));
        EnvironmentData data = environmentDataRepository
                .findTopByClassroomOrderByRecordedAtDesc(classroom);
        return ResponseEntity.ok(toResponse(classroom, data));
    }

    /** Historical data for a classroom (last N entries) */
    @GetMapping("/history/{classroomId}")
    public ResponseEntity<List<EnvironmentResponse>> getHistory(
            @PathVariable Long classroomId,
            @RequestParam(defaultValue = "50") int limit) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new com.finalYear.smartClassRoom.exception
                        .ResourceNotFoundException("Classroom", classroomId));
        List<EnvironmentData> data = environmentDataRepository
                .findByClassroom(classroom);
        // Return last `limit` records
        int size = data.size();
        List<EnvironmentData> paged = data.subList(Math.max(0, size - limit), size);
        List<EnvironmentResponse> result = paged.stream()
                .map(d -> toResponse(classroom, d))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** Dashboard summary (latest across all classrooms) */
    @GetMapping("/dashboard")
    public ResponseEntity<List<EnvironmentResponse>> getDashboard() {
        return getAllLatest();
    }

    // ── IoT data ingestion (called by ESP32 / Python service) ─────────────────
    @PostMapping("/ingest")
    public ResponseEntity<String> ingest(@RequestBody EnvironmentIngestRequest req) {
        classroomRepository.findByEsp32Id(req.esp32Id()).ifPresent(classroom -> {
            EnvironmentData data = EnvironmentData.builder()
                    .classroom(classroom)
                    .temperature(req.temperature())
                    .humidity(req.humidity())
                    .co2Level(req.co2Level())
                    .lightLevel(req.lightLevel())
                    .noiseLevel(req.noiseLevel())
                    .airQualityIndex(req.airQualityIndex())
                    .build();
            environmentDataRepository.save(data);
        });
        return ResponseEntity.ok("OK");
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private EnvironmentResponse toResponse(Classroom classroom, EnvironmentData data) {
        if (data == null) {
            return EnvironmentResponse.builder()
                    .classroomId(classroom.getId())
                    .roomNumber(classroom.getRoomNumber())
                    .build();
        }
        return EnvironmentResponse.builder()
                .classroomId(classroom.getId())
                .roomNumber(classroom.getRoomNumber())
                .temperature(data.getTemperature())
                .humidity(data.getHumidity())
                .co2Level(data.getCo2Level())
                .lightLevel(data.getLightLevel())
                .noiseLevel(data.getNoiseLevel())
                .airQualityIndex(data.getAirQualityIndex())
                .recordedAt(data.getRecordedAt())
                .build();
    }

    // ── Inner record for ingest payload ───────────────────────────────────────
    public record EnvironmentIngestRequest(
            String esp32Id,
            Double temperature,
            Double humidity,
            Double co2Level,
            Double lightLevel,
            Double noiseLevel,
            Double airQualityIndex
    ) {}
}
