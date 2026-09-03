package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.config.JwtService;
import com.finalYear.smartClassRoom.dto.request.StudentSelfRegisterRequest;
import com.finalYear.smartClassRoom.dto.response.AuthResponse;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.UserRepository;
import com.finalYear.smartClassRoom.service.StudentSelfRegisterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentSelfRegisterServiceImpl implements StudentSelfRegisterService {

    private final StudentRepository studentRepository;
    private final UserRepository    userRepository;
    private final PasswordEncoder   passwordEncoder;
    private final JwtService        jwtService;

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: Verify identity — returns a preview, does NOT create an account
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public Map<String, Object> verifyIdentity(String rollNumber, String dateOfBirth) {
        if (rollNumber == null || rollNumber.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Roll Number is required.");
        }
        if (dateOfBirth == null || dateOfBirth.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of Birth is required.");
        }

        LocalDate dob;
        try {
            dob = LocalDate.parse(dateOfBirth);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid date format. Expected YYYY-MM-DD.");
        }

        Student student = studentRepository
                .findByRollNumberAndDateOfBirth(rollNumber.trim().toUpperCase(), dob)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "No student found with this Roll Number and Date of Birth. " +
                        "Please contact your college administration."));

        if (student.getRegistrationStatus() != Student.RegistrationStatus.NOT_REGISTERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "An account already exists for this Roll Number. Please login instead.");
        }

        Map<String, Object> preview = new HashMap<>();
        preview.put("rollNumber",      student.getRollNumber());
        preview.put("firstName",       student.getFirstName());
        preview.put("lastName",        student.getLastName());
        preview.put("admissionNumber", student.getAdmissionNumber());
        preview.put("departmentName",  student.getDepartment()  != null ? student.getDepartment().getName()  : null);
        preview.put("semesterName",    student.getSemester()    != null ? student.getSemester().getName()    : null);
        preview.put("sectionName",     student.getSection()     != null ? student.getSection().getName()     : null);
        preview.put("branch",          student.getBranch());
        preview.put("academicYear",    student.getAcademicYear());
        preview.put("officialEmail",   student.getOfficialEmail());

        log.info("Identity verified for rollNumber={}", rollNumber);
        return preview;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 2: Create the login account
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AuthResponse selfRegister(StudentSelfRegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match.");
        }

        String roll = request.getRollNumber().trim().toUpperCase();

        LocalDate dob = request.getDateOfBirth();
        if (dob == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Date of Birth is required.");
        }

        Student student = studentRepository
                .findByRollNumberAndDateOfBirth(roll, dob)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Student not found. Verify your Roll Number and Date of Birth."));

        if (student.getRegistrationStatus() != Student.RegistrationStatus.NOT_REGISTERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Account already exists for this Roll Number. Please login.");
        }

        String email = request.getPersonalEmail().toLowerCase().trim();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This email is already registered. Use a different email.");
        }

        // Derive names from imported student data
        String firstName = student.getFirstName() != null ? student.getFirstName() : roll;
        String lastName  = student.getLastName()  != null ? student.getLastName()  : "";

        User user = User.builder()
                .email(email)
                .phone(request.getMobile())
                .firstName(firstName)
                .lastName(lastName)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.STUDENT)
                .enabled(true)
                .emailVerified(false)
                .accountLocked(false)
                .failedLoginAttempts(0)
                .build();

        user = userRepository.save(user);

        student.setUser(user);
        student.setRegistrationStatus(Student.RegistrationStatus.ACCOUNT_CREATED);
        studentRepository.save(student);

        log.info("Student account created: rollNumber={}, email={}", roll, email);

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .dashboardUrl("/student/dashboard")
                .build();
    }
}
