package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.DepartmentRequest;
import com.finalYear.smartClassRoom.dto.response.DepartmentResponse;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    @Lazy private final SemesterServiceImpl semesterService;

    @Override
    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {

        if (departmentRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException(
                    "Department with name already exists: " + request.getName());
        }

        if (departmentRepository.existsByCode(request.getCode())) {
            throw new DuplicateResourceException(
                    "Department with code already exists: " + request.getCode());
        }

        Department department = Department.builder()
                .name(request.getName().trim())
                .code(request.getCode().trim().toUpperCase())
                .description(request.getDescription())
                .build();

        Department saved = departmentRepository.save(department);

        // Auto-create semesters 1-8 for this new department
        semesterService.ensureSemestersExist(saved);
        log.info("[Department] Created '{}' — auto-created 8 semesters.", saved.getName());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {

        Department department = departmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department", id));

        department.setName(request.getName().trim());
        department.setCode(request.getCode().trim().toUpperCase());
        department.setDescription(request.getDescription());
        // hodName is not updated via this form — it is set automatically when a HOD is assigned

        return toResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse getById(Long id) {

        Department department = departmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department", id));

        return toResponse(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAll() {

        return departmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {

        Department department = departmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Department", id));

        departmentRepository.delete(department);
    }

    private DepartmentResponse toResponse(Department department) {

        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .description(department.getDescription())
                .hodName(department.getHod() != null
                        ? department.getHod().getFullName()
                        : department.getHodName())
                .studentCount(
                        department.getStudents() == null
                                ? 0
                                : department.getStudents().size())
                .teacherCount(
                        department.getTeachers() == null
                                ? 0
                                : department.getTeachers().size())
                .build();
    }
}