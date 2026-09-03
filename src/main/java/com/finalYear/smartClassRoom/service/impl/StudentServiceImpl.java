package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.StudentRequest;
import com.finalYear.smartClassRoom.dto.response.StudentResponse;
import com.finalYear.smartClassRoom.entity.*;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.MarksRepository;
import com.finalYear.smartClassRoom.repository.SectionRepository;
import com.finalYear.smartClassRoom.repository.SemesterRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.UserRepository;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.StudentService;
import com.finalYear.smartClassRoom.service.UserDeletionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserContextService currentUserCtx;
    private final MarksRepository marksRepository;
    private final UserDeletionService userDeletionService;
    private final SectionRepository sectionRepository;
    private final ClassroomAutoAssignService classroomAutoAssignService;

    @Override
    @Transactional
    public StudentResponse createStudent(StudentRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email already exists: " + request.getEmail());
        }

        if (studentRepository.existsByRollNumber(request.getRollNumber())) {
            throw new DuplicateResourceException(
                    "Roll Number already exists: " + request.getRollNumber());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department", request.getDepartmentId()));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", request.getSemesterId()));

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.STUDENT)
                .enabled(true)
                .build();

        user = userRepository.save(user);

        Student student = Student.builder()
                .user(user)
                .rollNumber(request.getRollNumber())
                .department(department)
                .semester(semester)
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .guardianName(request.getGuardianName())
                .guardianPhone(request.getGuardianPhone())
                .active(true)
                // Account is created at the same time as the student record by admin
                .registrationStatus(Student.RegistrationStatus.ACCOUNT_CREATED)
                .build();

        // Auto-assign to classroom (CSE-A, CSE-B, ECE-A …)
        try {
            student.setClassroom(classroomAutoAssignService.assignClassroom(department));
        } catch (Exception e) {
            log.warn("Auto classroom assignment failed for student {}: {}", request.getRollNumber(), e.getMessage());
        }

        return toResponse(studentRepository.save(student));

    }

    @Override
    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", id));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department", request.getDepartmentId()));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", request.getSemesterId()));

        student.getUser().setFirstName(request.getFirstName());
        student.getUser().setLastName(request.getLastName());
        student.setRollNumber(request.getRollNumber());
        student.setDepartment(department);
        student.setSemester(semester);
        student.setDateOfBirth(request.getDateOfBirth());
        student.getUser().setPhone(request.getPhone());
        student.setAddress(request.getAddress());
        student.setGuardianName(request.getGuardianName());
        student.setGuardianPhone(request.getGuardianPhone());

        student.getUser().setEmail(request.getEmail());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            student.getUser().setPassword(
                    passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(student.getUser());

        return toResponse(studentRepository.save(student));
    }

    @Override
    public StudentResponse getStudentById(Long id) {

        return toResponse(studentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", id)));
    }

    @Override
    public StudentResponse getStudentByRollNumber(String rollNumber) {

        return toResponse(studentRepository.findByRollNumber(rollNumber)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student with Roll Number " + rollNumber + " not found")));
    }
    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Page<StudentResponse> getAllStudents(Pageable pageable, Long departmentId) {
        // Resolve effective dept — HOD/TEACHER always use their own dept
        Long effectiveDeptId = currentUserCtx.resolveEffectiveDepartmentId(departmentId);

        if (effectiveDeptId != null) {
            // Return ALL students in the department (active + inactive) with eager fetch
            return studentRepository
                    .findByDepartment_Id(effectiveDeptId, pageable)
                    .map(this::toResponse);
        }
        // SUPER_ADMIN/ADMIN with no dept filter — return all students with eager fetch
        return studentRepository.findAllWithRelations(pageable).map(this::toResponse);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<StudentResponse> getStudentsByDepartmentAndSemester(
            Long departmentId,
            Long semesterId) {

        // Validate department exists
        departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));

        // Resolve the semester to get its NUMBER (1-8)
        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", semesterId));

        // Query by dept_id + semester NUMBER so students created with any semester
        // record for "Semester X" are all returned — avoids ID mismatch issues.
        return studentRepository
                .findByDepartment_IdAndSemester_Number(departmentId, semester.getNumber())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteStudent(Long id) {

        Student student = studentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", id));

        // Phase 2: Dept-level access check
        if (student.getDepartment() != null) {
            currentUserCtx.assertDepartmentAccess(student.getDepartment().getId());
        }

        // ── Cascade-delete all FK-dependent rows in correct order ────────────

        // 1. Marks (student_id NOT NULL → must delete before student)
        marksRepository.deleteByStudentId(id);

        // 2. Faces and Attendances already have cascade=ALL on Student entity,
        //    so they will be removed automatically when we delete the student below.

        // 3. Permanently remove the Student profile row
        User linkedUser = student.getUser();
        studentRepository.delete(student);
        studentRepository.flush();

        // 4. Delete the User + all its dependent records (RefreshToken, Notification, AuditLog, AISession, AIQuery)
        if (linkedUser != null) {
            userDeletionService.deleteUser(linkedUser);
        }

        log.info("[StudentService] Permanently deleted student id={} (user={})",
                id, linkedUser != null ? linkedUser.getEmail() : "none");
    }

    private StudentResponse toResponse(Student student) {
        User u = student.getUser(); // may be null for NOT_REGISTERED students

        // Defensive: registrationStatus can be null for records created before the field was added
        Student.RegistrationStatus status = student.getRegistrationStatus();
        if (status == null) {
            status = u != null ? Student.RegistrationStatus.ACCOUNT_CREATED
                               : Student.RegistrationStatus.NOT_REGISTERED;
        }

        return StudentResponse.builder()
                .id(student.getId())
                .userId(u != null ? u.getId() : null)
                .email(student.getEmail())
                .rollNumber(student.getRollNumber())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())

                .departmentId(
                        student.getDepartment() != null
                                ? student.getDepartment().getId()
                                : null)

                .departmentName(
                        student.getDepartment() != null
                                ? student.getDepartment().getName()
                                : null)

                .semesterId(
                        student.getSemester() != null
                                ? student.getSemester().getId()
                                : null)

                .semesterName(
                        student.getSemester() != null
                                ? student.getSemester().getName()
                                : null)

                .sectionId(
                        student.getSection() != null
                                ? student.getSection().getId()
                                : null)

                .sectionName(
                        student.getSection() != null
                                ? student.getSection().getName()
                                : null)

                .classroomId(
                        student.getClassroom() != null
                                ? student.getClassroom().getId()
                                : null)

                .classroomName(
                        student.getClassroom() != null
                                ? student.getClassroom().getRoomNumber()
                                : null)

                .dateOfBirth(student.getDateOfBirth())
                .phone(student.getPhone())
                .address(student.getAddress())
                .guardianName(student.getGuardianName())
                .guardianPhone(student.getGuardianPhone())
                .profileImage(student.getProfileImage())
                .admissionNumber(student.getAdmissionNumber())
                .officialEmail(student.getOfficialEmail())
                .branch(student.getBranch())
                .academicYear(student.getAcademicYear())
                .registrationStatus(status)
                .active(student.isActive())
                .createdAt(student.getCreatedAt())
                .build();
    }

    // ── Semester Promotion ───────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> promoteStudent(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        // Dept-level access check (HOD can only promote within own dept)
        if (student.getDepartment() != null) {
            currentUserCtx.assertDepartmentAccess(student.getDepartment().getId());
        }

        Semester currentSem = student.getSemester();
        if (currentSem == null) {
            return Map.of("status", "skipped",
                          "message", "Student has no semester assigned.");
        }

        int currentNumber = currentSem.getNumber();

        // Sem 8 → Graduated
        if (currentNumber >= 8) {
            student.setActive(false);
            student.getUser().setEnabled(false);
            studentRepository.save(student);
            userRepository.save(student.getUser());
            log.info("[Promotion] Student {} graduated (completed Sem 8)",
                    student.getRollNumber());
            return Map.of(
                    "status",  "graduated",
                    "student", student.getRollNumber(),
                    "from",    currentNumber,
                    "message", "Student has been marked as graduated.");
        }

        // Find next semester in the same department
        Long deptId = student.getDepartment().getId();
        Optional<Semester> nextSemOpt = semesterRepository
                .findByDepartment_IdAndNumber(deptId, currentNumber + 1);

        if (nextSemOpt.isEmpty()) {
            return Map.of(
                    "status",  "error",
                    "message", "Semester " + (currentNumber + 1) +
                               " not found for this department.");
        }

        Semester nextSem = nextSemOpt.get();
        student.setSemester(nextSem);
        studentRepository.save(student);

        log.info("[Promotion] Student {} promoted Sem {} → Sem {}",
                student.getRollNumber(), currentNumber, currentNumber + 1);

        return Map.of(
                "status",  "promoted",
                "student", student.getRollNumber(),
                "from",    currentNumber,
                "to",      currentNumber + 1,
                "message", "Student promoted to Semester " + (currentNumber + 1));
    }

    @Override
    @Transactional
    public Map<String, Object> promoteStudentsBatch(
            Long departmentId, Long semesterId) {

        // Dept-level access check
        currentUserCtx.assertDepartmentAccess(departmentId);

        List<Student> students = studentRepository
                .findByDepartment_IdAndSemester_IdAndActiveTrue(departmentId, semesterId);

        if (students.isEmpty()) {
            return Map.of(
                    "total",     0,
                    "promoted",  0,
                    "graduated", 0,
                    "message",   "No active students found in this department and semester.");
        }

        int promoted  = 0;
        int graduated = 0;

        for (Student student : students) {
            Semester currentSem = student.getSemester();
            if (currentSem == null) continue;

            int currentNumber = currentSem.getNumber();

            if (currentNumber >= 8) {
                // Graduate the student
                student.setActive(false);
                student.getUser().setEnabled(false);
                studentRepository.save(student);
                userRepository.save(student.getUser());
                graduated++;
                log.info("[Promotion] Batch: {} graduated", student.getRollNumber());
            } else {
                // Promote to next semester
                Optional<Semester> nextSemOpt = semesterRepository
                        .findByDepartment_IdAndNumber(departmentId, currentNumber + 1);
                if (nextSemOpt.isPresent()) {
                    student.setSemester(nextSemOpt.get());
                    studentRepository.save(student);
                    promoted++;
                    log.info("[Promotion] Batch: {} Sem {} → {}",
                            student.getRollNumber(), currentNumber, currentNumber + 1);
                }
            }
        }

        log.info("[Promotion] Batch complete: dept={} sem={} promoted={} graduated={}",
                departmentId, semesterId, promoted, graduated);

        return Map.of(
                "total",     students.size(),
                "promoted",  promoted,
                "graduated", graduated,
                "message",   promoted + " student(s) promoted, " + graduated + " graduated.");
    }

    // ── Section assignment ────────────────────────────────────────────────────

    @Override
    @Transactional
    public Map<String, Object> assignSection(Long studentId, Long sectionId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));

        if (sectionId == null) {
            student.setSection(null);
            studentRepository.save(student);
            return Map.of("studentId", studentId, "sectionId", "", "message", "Section removed.");
        }

        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));

        student.setSection(section);
        studentRepository.save(student);
        log.info("Student {} assigned to section {}", student.getRollNumber(), section.getName());
        return Map.of(
                "studentId",  studentId,
                "sectionId",  sectionId,
                "sectionName", section.getName(),
                "message",    student.getFullName() + " assigned to Section " + section.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<?> getStudentsBySection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        return studentRepository.findBySection(section).stream()
                .map(this::toResponse).toList();
    }
}