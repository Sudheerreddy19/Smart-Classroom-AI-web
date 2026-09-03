package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.response.FaceRegistrationResponse;
import com.finalYear.smartClassRoom.dto.response.StudentResponse;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.StudentFace;
import com.finalYear.smartClassRoom.entity.Teacher;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.StudentFaceRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.TeacherRepository;
import com.finalYear.smartClassRoom.service.FaceRegistrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class FaceRegistrationServiceImpl implements FaceRegistrationService {

    private final StudentRepository     studentRepository;
    private final TeacherRepository     teacherRepository;
    private final StudentFaceRepository studentFaceRepository;
    private final RestTemplate          restTemplate;

    @Value("${face.service.url:http://localhost:8000}")
    private String faceServiceUrl;

    // ─────────────────────────────────────────────────────────────────────────
    // Register face — calls Python service and updates student status
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public FaceRegistrationResponse registerFace(Long studentId, User caller) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        // Allow re-capture even if already FACE_REGISTERED (teacher re-captures)
        if (student.getRegistrationStatus() == Student.RegistrationStatus.NOT_REGISTERED) {
            throw new IllegalStateException(
                    "Student must create their account first before face registration. " +
                    "Current status: NOT_REGISTERED");
        }

        // Resolve teacher profile if caller is TEACHER/HOD
        Teacher capturedByTeacher = null;
        if (caller.getRole() == User.Role.TEACHER || caller.getRole() == User.Role.HOD) {
            capturedByTeacher = teacherRepository.findByUserId(caller.getId()).orElse(null);
        }

        final Teacher finalTeacher = capturedByTeacher;
        String url = faceServiceUrl + "/face/capture/" + studentId;

        // Build request body with student details — Python requires 'registerNumber'
        Map<String, Object> requestBody = new java.util.HashMap<>();
        requestBody.put("registerNumber", student.getRollNumber());
        requestBody.put("student_id",     String.valueOf(studentId));
        requestBody.put("studentName",    student.getFullName());
        requestBody.put("department",     student.getDepartment() != null ? student.getDepartment().getName() : "");
        requestBody.put("semester",       student.getSemester()   != null ? String.valueOf(student.getSemester().getNumber()) : "");
        requestBody.put("teacher_id",     finalTeacher != null ? String.valueOf(finalTeacher.getId()) : null);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response == null || !Boolean.TRUE.equals(response.get("success"))) {
                String msg = response != null ? (String) response.get("message") : "No response from face service";
                throw new RuntimeException("Face capture failed: " + msg);
            }

            // Extract response data safely
            int imagesCaptured = response.get("images_captured") instanceof Number n
                    ? n.intValue() : 0;
            String encodingPath  = (String) response.get("encoding_path");
            @SuppressWarnings("unchecked")
            List<String> imagePaths = (List<String>) response.getOrDefault("image_paths", List.of());

            // Remove any previous face records for this student (prevent duplicates on re-capture)
            if (studentFaceRepository.existsByStudent(student)) {
                studentFaceRepository.deleteByStudent(student);
                log.info("Removed old face records for studentId={} before re-capture", studentId);
            }

            // Persist new face record
            StudentFace face = StudentFace.builder()
                    .student(student)
                    .encodingPath(encodingPath)
                    .imagePath(imagePaths.isEmpty() ? "" : imagePaths.get(0))
                    .angleType(StudentFace.AngleType.FRONT)
                    .capturedByTeacher(finalTeacher)
                    .captureDate(LocalDateTime.now())
                    .totalImages(imagesCaptured)
                    .active(true)
                    .build();

            studentFaceRepository.save(face);

            // Advance lifecycle status
            student.setRegistrationStatus(Student.RegistrationStatus.FACE_REGISTERED);
            studentRepository.save(student);

            log.info("Face registered for studentId={} by userId={}", studentId, caller.getId());

            return FaceRegistrationResponse.builder()
                    .studentId(studentId)
                    .rollNumber(student.getRollNumber())
                    .studentName(student.getFullName())
                    .success(true)
                    .imagesCaptured(imagesCaptured)
                    .encodingPath(encodingPath)
                    .message("Face registration successful! " + imagesCaptured + " images captured.")
                    .capturedAt(LocalDateTime.now())
                    .build();

        } catch (ResourceAccessException e) {
            log.error("Python face service unreachable at {}", url);
            throw new RuntimeException(
                    "Face service is not running. Please start the Python service on port 8000. " +
                    "See ai-face-service/README.md for instructions.");
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during face registration for studentId={}: {}", studentId, e.getMessage(), e);
            throw new RuntimeException("Face capture error: " + e.getMessage());
        }
    }


    // ─────────────────────────────────────────────────────────────────────────
    // Get face status for a student
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public FaceRegistrationResponse getFaceStatus(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        boolean hasFace = student.getRegistrationStatus() == Student.RegistrationStatus.FACE_REGISTERED;
        return FaceRegistrationResponse.builder()
                .studentId(studentId)
                .rollNumber(student.getRollNumber())
                .studentName(student.getFullName())
                .success(hasFace)
                .message(hasFace ? "Face registered" : "Face not yet registered")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // List students pending face registration
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public Page<StudentResponse> getPendingFaceStudents(Long departmentId, Pageable pageable) {
        return studentRepository.findPendingFaceRegistration(departmentId, pageable)
                .map(this::toResponse);
    }

    // ── Mapper ───────────────────────────────────────────────────────────────

    private StudentResponse toResponse(Student s) {
        return StudentResponse.builder()
                .id(s.getId())
                .userId(s.getUser() != null ? s.getUser().getId() : null)
                .email(s.getEmail())
                .rollNumber(s.getRollNumber())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .departmentId(s.getDepartment()  != null ? s.getDepartment().getId()   : null)
                .departmentName(s.getDepartment() != null ? s.getDepartment().getName() : null)
                .semesterId(s.getSemester()      != null ? s.getSemester().getId()     : null)
                .semesterName(s.getSemester()    != null ? s.getSemester().getName()   : null)
                .sectionId(s.getSection()        != null ? s.getSection().getId()      : null)
                .sectionName(s.getSection()      != null ? s.getSection().getName()    : null)
                .dateOfBirth(s.getDateOfBirth())
                .phone(s.getPhone())
                .admissionNumber(s.getAdmissionNumber())
                .officialEmail(s.getOfficialEmail())
                .branch(s.getBranch())
                .academicYear(s.getAcademicYear())
                .registrationStatus(s.getRegistrationStatus())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
