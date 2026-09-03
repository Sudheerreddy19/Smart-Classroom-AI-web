package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.SemesterRequest;
import com.finalYear.smartClassRoom.dto.response.SemesterResponse;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.entity.Semester;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.SemesterRepository;
import com.finalYear.smartClassRoom.service.SemesterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SemesterServiceImpl implements SemesterService {

    private final SemesterRepository semesterRepository;
    private final DepartmentRepository departmentRepository;

    // ── Default semester schedule (shared / global) ───────────────────────────
    private static final Map<Integer, LocalDate[]> DEFAULT_DATES = Map.of(
        1, new LocalDate[]{ LocalDate.of(2026, 9,  1), LocalDate.of(2027, 1, 31) },
        2, new LocalDate[]{ LocalDate.of(2027, 3,  1), LocalDate.of(2027, 7, 31) },
        3, new LocalDate[]{ LocalDate.of(2027, 9,  1), LocalDate.of(2028, 1, 31) },
        4, new LocalDate[]{ LocalDate.of(2028, 3,  1), LocalDate.of(2028, 7, 31) },
        5, new LocalDate[]{ LocalDate.of(2028, 9,  1), LocalDate.of(2029, 1, 31) },
        6, new LocalDate[]{ LocalDate.of(2029, 3,  1), LocalDate.of(2029, 7, 31) },
        7, new LocalDate[]{ LocalDate.of(2029, 9,  1), LocalDate.of(2030, 1, 31) },
        8, new LocalDate[]{ LocalDate.of(2030, 3,  1), LocalDate.of(2030, 7, 31) }
    );

    private static final String[] SEM_NAMES = {
        "", "Semester 1", "Semester 2", "Semester 3", "Semester 4",
        "Semester 5", "Semester 6", "Semester 7", "Semester 8"
    };

    // ─────────────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SemesterResponse create(SemesterRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));

        Semester semester = Semester.builder()
                .name(request.getName())
                .number(request.getNumber())
                .department(department)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .active(request.isActive())
                .build();

        return toResponse(semesterRepository.save(semester));
    }

    @Override
    @Transactional
    public SemesterResponse update(Long id, SemesterRequest request) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", id));

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department", request.getDepartmentId()));

        semester.setName(request.getName());
        semester.setNumber(request.getNumber());
        semester.setDepartment(department);
        semester.setStartDate(request.getStartDate());
        semester.setEndDate(request.getEndDate());
        semester.setActive(request.isActive());

        return toResponse(semesterRepository.save(semester));
    }

    @Override
    public SemesterResponse getById(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", id));
        return toResponse(semester);
    }

    @Override
    public List<SemesterResponse> getAll() {
        return semesterRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns all 8 semesters for the given department.
     * Auto-creates any missing semesters 1-8 with default dates on the fly.
     */
    @Override
    @Transactional
    public List<SemesterResponse> getByDepartment(Long departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Department", departmentId));

        ensureSemestersExist(department);

        return semesterRepository.findByDepartment_IdOrderByNumberAsc(departmentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", id));
        semesterRepository.delete(semester);
    }

    // ─── Patch only dates ─────────────────────────────────────────────────────

    /**
     * Updates only the start/end dates of a semester without touching
     * its name, number, or department. Safe for use from the UI "Edit Dates" modal.
     */
    @Override
    @Transactional
    public SemesterResponse updateTimeline(Long id, LocalDate startDate, LocalDate endDate) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Semester", id));
        semester.setStartDate(startDate);
        semester.setEndDate(endDate);
        semesterRepository.save(semester);
        log.info("[Semester] Timeline updated: {} (Sem {}) → {} to {}",
                semester.getDepartment() != null ? semester.getDepartment().getName() : "?",
                semester.getNumber(), startDate, endDate);
        return toResponse(semester);
    }

    /**
     * Applies the same start/end dates for a given semester NUMBER to
     * that same semester across ALL departments.
     * Used for "Apply to All Departments" bulk action.
     *
     * @return number of department-semesters updated
     */
    @Override
    @Transactional
    public int applyTimelineToAllDepts(int semesterNumber, LocalDate startDate, LocalDate endDate) {
        List<Semester> matching = semesterRepository.findAll()
                .stream()
                .filter(s -> s.getNumber() != null && s.getNumber() == semesterNumber)
                .toList();

        for (Semester s : matching) {
            s.setStartDate(startDate);
            s.setEndDate(endDate);
        }
        semesterRepository.saveAll(matching);
        log.info("[Semester] Applied Sem {} timeline ({} → {}) to {} departments.",
                semesterNumber, startDate, endDate, matching.size());
        return matching.size();
    }

    // ─── Auto-create semesters 1-8 for a department if not present ───────────

    /**
     * Idempotent: creates only the semesters that are missing.
     * Called automatically by getByDepartment() and by AcademicCalendarDataInitializer.
     */
    @Transactional
    public void ensureSemestersExist(Department department) {
        List<Semester> existing = semesterRepository.findByDepartment_IdOrderByNumberAsc(department.getId());
        List<Integer> existingNumbers = existing.stream().map(Semester::getNumber).toList();

        List<Semester> toCreate = new ArrayList<>();
        for (int n = 1; n <= 8; n++) {
            if (!existingNumbers.contains(n)) {
                LocalDate[] dates = DEFAULT_DATES.get(n);
                toCreate.add(Semester.builder()
                        .name(SEM_NAMES[n])
                        .number(n)
                        .department(department)
                        .startDate(dates[0])
                        .endDate(dates[1])
                        .active(true)
                        .build());
            }
        }

        if (!toCreate.isEmpty()) {
            semesterRepository.saveAll(toCreate);
            log.info("[Semester] Auto-created {} missing semesters for department: {}",
                    toCreate.size(), department.getName());
        }
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private SemesterResponse toResponse(Semester semester) {
        return SemesterResponse.builder()
                .id(semester.getId())
                .name(semester.getName())
                .number(semester.getNumber())
                .departmentId(semester.getDepartment() != null ? semester.getDepartment().getId() : null)
                .departmentName(semester.getDepartment() != null ? semester.getDepartment().getName() : null)
                .startDate(semester.getStartDate())
                .endDate(semester.getEndDate())
                .active(semester.isActive())
                .build();
    }
}