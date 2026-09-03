package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.AttendanceSessionRequest;
import com.finalYear.smartClassRoom.dto.request.FaceAttendanceRequest;
import com.finalYear.smartClassRoom.dto.request.MarkAttendanceRequest;
import com.finalYear.smartClassRoom.dto.response.AttendanceResponse;
import com.finalYear.smartClassRoom.dto.response.AttendanceSessionResponse;
import com.finalYear.smartClassRoom.dto.response.FaceAttendanceResult;
import com.finalYear.smartClassRoom.entity.*;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.*;
import com.finalYear.smartClassRoom.service.AttendanceService;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRepository        attendanceRepository;
    private final ClassroomRepository         classroomRepository;
    private final SubjectRepository           subjectRepository;
    private final TeacherRepository           teacherRepository;
    private final StudentRepository           studentRepository;
    private final CurrentUserContextService   currentUserCtx;
    private final RestTemplate                restTemplate;

    @Value("${face.service.url:http://localhost:8000}")
    private String faceServiceUrl;

    @Override
    @Transactional
    public AttendanceSessionResponse createSession(AttendanceSessionRequest request) {

        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException("Classroom", request.getClassroomId()));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject", request.getSubjectId()));

        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.getTeacherId()));

        AttendanceSession session = AttendanceSession.builder()
                .classroom(classroom)
                .subject(subject)
                .teacher(teacher)
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .status(AttendanceSession.SessionStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();

        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    @Override
    @Transactional
    public AttendanceSessionResponse closeSession(Long sessionId) {

        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance Session", sessionId));

        session.setEndTime(LocalTime.now());
        session.setStatus(AttendanceSession.SessionStatus.COMPLETED);

        return toSessionResponse(attendanceSessionRepository.save(session));
    }

    @Override
    @Transactional
    public AttendanceResponse markAttendance(MarkAttendanceRequest request) {

        AttendanceSession session = attendanceSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Attendance Session", request.getSessionId()));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", request.getStudentId()));

        Attendance attendance = Attendance.builder()
                .attendanceSession(session)
                .student(student)
                .status(request.getStatus())
                .method(request.getMethod())
                .confidenceScore(request.getConfidenceScore())
                .markedAt(LocalDateTime.now())
                .build();

        return toAttendanceResponse(attendanceRepository.save(attendance));
    }

    @Override
    public List<AttendanceResponse> getSessionAttendance(Long sessionId) {

        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance Session", sessionId));

        return attendanceRepository.findByAttendanceSession(session)
                .stream()
                .map(this::toAttendanceResponse)
                .toList();
    }

    @Override
    public List<AttendanceSessionResponse> getTodaySessions() {
        java.time.LocalDate today = java.time.LocalDate.now();
        User.Role role = currentUserCtx.getCallerRole();

        if (role == User.Role.HOD || role == User.Role.TEACHER) {
            Long deptId = currentUserCtx.getCallerDepartmentId();
            if (deptId != null) {
                return attendanceSessionRepository
                        .findByTeacher_Department_IdAndSessionDate(deptId, today)
                        .stream().map(this::toSessionResponse).toList();
            }
        }
        return attendanceSessionRepository.findBySessionDate(today)
                .stream().map(this::toSessionResponse).toList();
    }

    // ── Face-recognition attendance ───────────────────────────────────────────

    @Override
    @Transactional
    public FaceAttendanceResult faceMarkAttendance(FaceAttendanceRequest request, User caller) {

        AttendanceSession session = attendanceSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", request.getSessionId()));

        if (session.getStatus() != AttendanceSession.SessionStatus.ACTIVE) {
            return FaceAttendanceResult.builder()
                    .success(false).code("SESSION_CLOSED")
                    .message("This attendance session is already closed.").build();
        }

        Map<String, Object> pyBody = new HashMap<>();
        // Always derive subject/teacher from the stored session — never trust empty frontend labels
        String subjectName = session.getSubject() != null ? session.getSubject().getName() : "Unknown";
        String teacherId   = session.getTeacher() != null
                ? (session.getTeacher().getEmployeeId() != null
                    ? session.getTeacher().getEmployeeId()
                    : String.valueOf(session.getTeacher().getId()))
                : "teacher-" + session.getId();
        pyBody.put("subject",    subjectName);
        pyBody.put("session",    "session-" + session.getId());
        pyBody.put("teacher_id", teacherId);
        // Forward browser webcam frame so Python skips opening its own camera
        if (request.getImageBase64() != null && !request.getImageBase64().isBlank()) {
            pyBody.put("image_base64", request.getImageBase64());
        }

        String pyUrl = faceServiceUrl + "/attendance";



        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> pyResp = restTemplate.postForObject(pyUrl, pyBody, Map.class);

            if (pyResp == null) {
                return FaceAttendanceResult.builder().success(false).code("NO_RESPONSE")
                        .message("No response from Python face service.").build();
            }

            String code = (String) pyResp.getOrDefault("code", "UNKNOWN");

            if (!"MARKED".equals(code)) {
                return FaceAttendanceResult.builder()
                        .success(false).code(code)
                        .message((String) pyResp.getOrDefault("message", code)).build();
            }

            String rollNumber  = (String) pyResp.get("student_id");
            String studentName = (String) pyResp.getOrDefault("student_name", "");

            Student student = studentRepository.findByRollNumber(rollNumber).orElse(null);

            if (student == null) {
                log.warn("Face recognised roll={} but not found in Spring Boot DB", rollNumber);
                return FaceAttendanceResult.builder()
                        .success(true).code("MARKED_PYTHON_ONLY")
                        .studentId(rollNumber).studentName(studentName)
                        .message("Face recognised but student not linked in system. Attendance logged in Python only.")
                        .build();
            }

            boolean alreadyMarked = attendanceRepository
                    .findByAttendanceSessionAndStudent(session, student).isPresent();
            if (alreadyMarked) {
                return FaceAttendanceResult.builder()
                        .success(false).code("DUPLICATE")
                        .studentId(rollNumber).studentName(student.getFullName())
                        .dbStudentId(student.getId())
                        .message(student.getFullName() + " is already marked PRESENT in this session.").build();
            }

            Attendance attendance = Attendance.builder()
                    .attendanceSession(session)
                    .student(student)
                    .status(Attendance.AttendanceStatus.PRESENT)
                    .method(Attendance.MarkingMethod.FACE_RECOGNITION)
                    .confidenceScore(pyResp.get("confidence") instanceof Number n ? n.doubleValue() : null)
                    .markedAt(LocalDateTime.now())
                    .build();
            attendanceRepository.save(attendance);

            session.setPresentCount(session.getPresentCount() + 1);
            attendanceSessionRepository.save(session);

            log.info("Face attendance marked: roll={} session={}", rollNumber, session.getId());

            return FaceAttendanceResult.builder()
                    .success(true).code("MARKED")
                    .studentId(rollNumber).studentName(student.getFullName())
                    .dbStudentId(student.getId())
                    .status(Attendance.AttendanceStatus.PRESENT)
                    .markedAt(LocalDateTime.now())
                    .message(student.getFullName() + " marked PRESENT via face recognition.")
                    .build();

        } catch (ResourceAccessException e) {
            log.error("Python face service unreachable at {}", pyUrl);
            throw new RuntimeException("Face service is not running. Please start Python on port 8000.");
        } catch (Exception e) {
            log.error("Face attendance error: {}", e.getMessage(), e);
            throw new RuntimeException("Face attendance error: " + e.getMessage());
        }
    }

    // ── Multi-face concurrent attendance ──────────────────────────────────────

    @Override
    @Transactional
    public List<FaceAttendanceResult> faceMarkAttendanceMulti(FaceAttendanceRequest request, User caller) {

        AttendanceSession session = attendanceSessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("AttendanceSession", request.getSessionId()));

        if (session.getStatus() != AttendanceSession.SessionStatus.ACTIVE) {
            return List.of(FaceAttendanceResult.builder()
                    .success(false).code("SESSION_CLOSED")
                    .message("This attendance session is already closed.").build());
        }

        // Build Python request body
        String subjectName = session.getSubject() != null ? session.getSubject().getName() : "Unknown";
        String teacherId   = session.getTeacher() != null
                ? (session.getTeacher().getEmployeeId() != null
                    ? session.getTeacher().getEmployeeId()
                    : String.valueOf(session.getTeacher().getId()))
                : "teacher-" + session.getId();

        Map<String, Object> pyBody = new HashMap<>();
        pyBody.put("subject",      subjectName);
        pyBody.put("session",      "session-" + session.getId());
        pyBody.put("teacher_id",   teacherId);
        if (request.getImageBase64() != null && !request.getImageBase64().isBlank()) {
            pyBody.put("image_base64", request.getImageBase64());
        }

        String pyUrl = faceServiceUrl + "/attendance/multi";

        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> pyResponses =
                restTemplate.postForObject(pyUrl, pyBody, List.class);

            if (pyResponses == null || pyResponses.isEmpty()) {
                return List.of(FaceAttendanceResult.builder()
                        .success(false).code("NO_FACE")
                        .message("No faces detected in the frame.").build());
            }

            List<FaceAttendanceResult> results = new ArrayList<>();
            int newlyMarked = 0;

            for (Map<String, Object> pyResp : pyResponses) {
                String code = (String) pyResp.getOrDefault("code", "UNKNOWN");

                if (!"MARKED".equals(code)) {
                    results.add(FaceAttendanceResult.builder()
                            .success("DUPLICATE".equals(code))
                            .code(code)
                            .studentId((String) pyResp.get("student_id"))
                            .studentName((String) pyResp.getOrDefault("student_name", ""))
                            .message((String) pyResp.getOrDefault("message", code))
                            .build());
                    continue;
                }

                String rollNumber  = (String) pyResp.get("student_id");
                String studentName = (String) pyResp.getOrDefault("student_name", "");

                Student student = studentRepository.findByRollNumber(rollNumber).orElse(null);
                if (student == null) {
                    log.warn("Multi-face: recognised roll={} not in Spring Boot DB", rollNumber);
                    results.add(FaceAttendanceResult.builder()
                            .success(true).code("MARKED_PYTHON_ONLY")
                            .studentId(rollNumber).studentName(studentName)
                            .message("Face recognised but not linked. Attendance in Python only.").build());
                    continue;
                }

                // Skip if already marked in THIS session
                if (attendanceRepository.findByAttendanceSessionAndStudent(session, student).isPresent()) {
                    results.add(FaceAttendanceResult.builder()
                            .success(false).code("DUPLICATE")
                            .studentId(rollNumber).studentName(student.getFullName())
                            .dbStudentId(student.getId())
                            .message(student.getFullName() + " already marked in this session.").build());
                    continue;
                }

                // Save attendance record
                Attendance attendance = Attendance.builder()
                        .attendanceSession(session)
                        .student(student)
                        .status(Attendance.AttendanceStatus.PRESENT)
                        .method(Attendance.MarkingMethod.FACE_RECOGNITION)
                        .confidenceScore(pyResp.get("confidence") instanceof Number n ? n.doubleValue() : null)
                        .markedAt(LocalDateTime.now())
                        .build();
                attendanceRepository.save(attendance);
                newlyMarked++;

                log.info("Multi-face attendance marked: roll={} session={}", rollNumber, session.getId());

                results.add(FaceAttendanceResult.builder()
                        .success(true).code("MARKED")
                        .studentId(rollNumber).studentName(student.getFullName())
                        .dbStudentId(student.getId())
                        .status(Attendance.AttendanceStatus.PRESENT)
                        .markedAt(LocalDateTime.now())
                        .message(student.getFullName() + " marked PRESENT via face recognition.").build());
            }

            if (newlyMarked > 0) {
                session.setPresentCount(session.getPresentCount() + newlyMarked);
                attendanceSessionRepository.save(session);
            }

            return results;

        } catch (ResourceAccessException e) {
            log.error("Python face service unreachable at {}", pyUrl);
            throw new RuntimeException("Face service is not running. Please start Python on port 8000.");
        } catch (Exception e) {
            log.error("Multi-face attendance error: {}", e.getMessage(), e);
            throw new RuntimeException("Multi-face attendance error: " + e.getMessage());
        }
    }

    // ── Report: student-wise attendance % ────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceReport(
            Long departmentId, Long semesterId, Long subjectId,
            LocalDate from, LocalDate to) {

        List<AttendanceSession> sessions = attendanceSessionRepository.findBySessionDateBetween(from, to);

        if (subjectId != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getSubject().getId().equals(subjectId))
                    .toList();
        }

        List<Attendance> allRecords = sessions.stream()
                .flatMap(s -> attendanceRepository.findByAttendanceSession(s).stream())
                .toList();

        Map<Long, List<Attendance>> byStudent = allRecords.stream()
                .filter(a -> {
                    Student st = a.getStudent();
                    if (departmentId != null && (st.getDepartment() == null
                            || !st.getDepartment().getId().equals(departmentId))) return false;
                    if (semesterId   != null && (st.getSemester()   == null
                            || !st.getSemester().getId().equals(semesterId)))   return false;
                    return true;
                })
                .collect(Collectors.groupingBy(a -> a.getStudent().getId()));

        return byStudent.entrySet().stream().map(e -> {
            List<Attendance> recs = e.getValue();
            Student st = recs.get(0).getStudent();
            long present = recs.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
            long total   = recs.size();
            double pct   = total > 0 ? (present * 100.0 / total) : 0.0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("studentId",      st.getId());
            row.put("rollNumber",     st.getRollNumber());
            row.put("studentName",    st.getFullName());
            row.put("department",     st.getDepartment() != null ? st.getDepartment().getName() : "");
            row.put("semester",       st.getSemester()   != null ? st.getSemester().getName()   : "");
            row.put("totalClasses",   total);
            row.put("presentClasses", present);
            row.put("absentClasses",  total - present);
            row.put("percentage",     Math.round(pct * 10.0) / 10.0);
            return row;
        }).sorted(Comparator.comparing(r -> r.get("rollNumber").toString()))
          .collect(Collectors.toList());
    }

    // ── Sessions in range ─────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceSessionResponse> getSessionsInRange(Long departmentId, LocalDate from, LocalDate to) {
        List<AttendanceSession> sessions = attendanceSessionRepository.findBySessionDateBetween(from, to);
        if (departmentId != null) {
            sessions = sessions.stream()
                    .filter(s -> s.getTeacher().getDepartment() != null
                              && s.getTeacher().getDepartment().getId().equals(departmentId))
                    .toList();
        }
        return sessions.stream().map(this::toSessionResponse).toList();
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AttendanceResponse toAttendanceResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .sessionId(attendance.getAttendanceSession().getId())
                .studentId(attendance.getStudent().getId())
                .studentName(attendance.getStudent().getFullName())
                .rollNumber(attendance.getStudent().getRollNumber())
                .status(attendance.getStatus())
                .method(attendance.getMethod())
                .confidenceScore(attendance.getConfidenceScore())
                .markedAt(attendance.getMarkedAt())
                .build();
    }

    private AttendanceSessionResponse toSessionResponse(AttendanceSession session) {
        int totalStudents = attendanceRepository.findByAttendanceSession(session).size();
        int present = (int) attendanceRepository.findByAttendanceSession(session)
                .stream()
                .filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT)
                .count();
        return AttendanceSessionResponse.builder()
                .id(session.getId())
                .classroomId(session.getClassroom().getId())
                .roomNumber(session.getClassroom().getRoomNumber())
                .subjectId(session.getSubject().getId())
                .subjectName(session.getSubject().getName())
                .teacherId(session.getTeacher().getId())
                .teacherName(session.getTeacher().getFullName())
                .sessionDate(session.getSessionDate())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .status(session.getStatus())
                .totalStudents(totalStudents)
                .presentCount(present)
                .createdAt(session.getCreatedAt())
                .build();
    }
}
