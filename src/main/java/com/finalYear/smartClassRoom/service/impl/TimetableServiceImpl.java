package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.TimetableRequest;
import com.finalYear.smartClassRoom.dto.response.TimetableResponse;
import com.finalYear.smartClassRoom.entity.*;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.*;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.TimetableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository  timetableRepository;
    private final SubjectRepository    subjectRepository;
    private final TeacherRepository    teacherRepository;
    private final ClassroomRepository  classroomRepository;
    private final SemesterRepository   semesterRepository;
    private final SectionRepository    sectionRepository;
    private final CurrentUserContextService currentUserCtx;

    // ── Helper: resolve entities ──────────────────────────────────────────────

    private Timetable buildFromRequest(TimetableRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject", request.getSubjectId()));
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", request.getTeacherId()));
        Classroom classroom = classroomRepository.findById(request.getClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException("Classroom", request.getClassroomId()));
        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() -> new ResourceNotFoundException("Semester", request.getSemesterId()));

        Section section = null;
        if (request.getSectionId() != null) {
            section = sectionRepository.findById(request.getSectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section", request.getSectionId()));
        }

        return Timetable.builder()
                .subject(subject).teacher(teacher)
                .classroom(classroom).semester(semester)
                .section(section)
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .active(true)
                .build();
    }

    @Override
    @Transactional
    public TimetableResponse create(TimetableRequest request) {
        Timetable t = timetableRepository.save(buildFromRequest(request));
        log.info("Timetable created: id={}", t.getId());
        return toResponse(t);
    }

    @Override
    @Transactional
    public List<TimetableResponse> bulkCreate(List<TimetableRequest> requests) {
        List<Timetable> entries = requests.stream().map(this::buildFromRequest).toList();
        List<Timetable> saved = timetableRepository.saveAll(entries);
        log.info("Bulk timetable created: {} slots", saved.size());
        return saved.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public TimetableResponse update(Long id, TimetableRequest request) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", id));
        Timetable updated = buildFromRequest(request);
        t.setSubject(updated.getSubject());
        t.setTeacher(updated.getTeacher());
        t.setClassroom(updated.getClassroom());
        t.setSemester(updated.getSemester());
        t.setSection(updated.getSection());
        t.setDayOfWeek(updated.getDayOfWeek());
        t.setStartTime(updated.getStartTime());
        t.setEndTime(updated.getEndTime());
        return toResponse(timetableRepository.save(t));
    }

    @Override
    public TimetableResponse getById(Long id) {
        return toResponse(timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", id)));
    }

    @Override
    public List<TimetableResponse> getAll() {
        User.Role role = currentUserCtx.getCallerRole();
        if (role == User.Role.HOD || role == User.Role.TEACHER || role == User.Role.STUDENT) {
            Long deptId = currentUserCtx.getCallerDepartmentId();
            if (deptId != null) {
                return timetableRepository.findByTeacher_Department_IdAndActiveTrue(deptId)
                        .stream().map(this::toResponse).toList();
            }
        }
        return timetableRepository.findByActiveTrue().stream().map(this::toResponse).toList();
    }

    @Override
    public List<TimetableResponse> getByClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom", classroomId));
        return timetableRepository.findByClassroom(classroom).stream().map(this::toResponse).toList();
    }

    @Override
    public List<TimetableResponse> getByTeacher(Long teacherId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", teacherId));
        return timetableRepository.findByTeacher(teacher).stream().map(this::toResponse).toList();
    }

    @Override
    public List<TimetableResponse> getBySection(Long sectionId) {
        return timetableRepository.findBySection_IdAndActiveTrue(sectionId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void deleteBySection(Long sectionId) {
        Section section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Section", sectionId));
        timetableRepository.deleteBySection(section);
        log.info("Deleted all timetable slots for sectionId={}", sectionId);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Timetable t = timetableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", id));
        t.setActive(false);
        timetableRepository.save(t);
        log.info("Timetable deactivated: {}", id);
    }

    // ── Mapper ────────────────────────────────────────────────────────────────

    private TimetableResponse toResponse(Timetable t) {
        return TimetableResponse.builder()
                .id(t.getId())
                .subjectId(t.getSubject().getId())
                .subjectName(t.getSubject().getName())
                .teacherId(t.getTeacher().getId())
                .teacherName(t.getTeacher().getFullName())
                .classroomId(t.getClassroom().getId())
                .roomNumber(t.getClassroom().getRoomNumber())
                .semesterId(t.getSemester().getId())
                .semesterName(t.getSemester().getName())
                .sectionId(t.getSection() != null ? t.getSection().getId() : null)
                .sectionName(t.getSection() != null ? t.getSection().getName() : null)
                .dayOfWeek(t.getDayOfWeek())
                .startTime(t.getStartTime())
                .endTime(t.getEndTime())
                .active(t.isActive())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}