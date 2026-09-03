package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.SubjectRequest;
import com.finalYear.smartClassRoom.dto.response.SubjectResponse;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.entity.Semester;
import com.finalYear.smartClassRoom.entity.Subject;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.SemesterRepository;
import com.finalYear.smartClassRoom.repository.SubjectRepository;
import com.finalYear.smartClassRoom.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubjectServiceImpl implements SubjectService {

    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public SubjectResponse create(SubjectRequest request) {

        Semester semester = null;
        Department department = null;

        if (request.getSemesterId() != null) {
            semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Semester", request.getSemesterId()));
        }

        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Department", request.getDepartmentId()));
        }

        Subject subject = Subject.builder()
                .name(request.getName())
                .code(request.getCode())
                .description(request.getDescription())
                .credits(request.getCredits())
                .totalHours(request.getTotalHours())
                .semester(semester)
                .department(department)
                .build();

        return toResponse(subjectRepository.save(subject));
    }

    @Override
    @Transactional
    public SubjectResponse update(Long id, SubjectRequest request) {

        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject", id));

        Semester semester = null;
        Department department = null;

        if (request.getSemesterId() != null) {
            semester = semesterRepository.findById(request.getSemesterId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Semester", request.getSemesterId()));
        }

        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException("Department", request.getDepartmentId()));
        }

        subject.setName(request.getName());
        subject.setCode(request.getCode());
        subject.setDescription(request.getDescription());
        subject.setCredits(request.getCredits());
        subject.setTotalHours(request.getTotalHours());
        subject.setSemester(semester);
        subject.setDepartment(department);

        return toResponse(subjectRepository.save(subject));
    }

    @Override
    public SubjectResponse getById(Long id) {

        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject", id));

        return toResponse(subject);
    }

    @Override
    public List<SubjectResponse> getAll() {

        return subjectRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<SubjectResponse> getBySemester(Long semesterId) {

        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", semesterId));

        return subjectRepository.findBySemester(semester)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {

        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject", id));

        subjectRepository.delete(subject);
    }

    private SubjectResponse toResponse(Subject subject) {

        return SubjectResponse.builder()
                .id(subject.getId())
                .name(subject.getName())
                .code(subject.getCode())
                .description(subject.getDescription())
                .credits(subject.getCredits())
                .totalHours(subject.getTotalHours())
                .semesterId(
                        subject.getSemester() != null
                                ? subject.getSemester().getId()
                                : null)
                .semesterName(
                        subject.getSemester() != null
                                ? subject.getSemester().getName()
                                : null)
                .departmentId(
                        subject.getDepartment() != null
                                ? subject.getDepartment().getId()
                                : null)
                .departmentName(
                        subject.getDepartment() != null
                                ? subject.getDepartment().getName()
                                : null)
                .build();
    }
}