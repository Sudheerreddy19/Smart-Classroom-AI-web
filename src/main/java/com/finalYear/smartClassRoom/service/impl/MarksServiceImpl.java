package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.MarksRequest;
import com.finalYear.smartClassRoom.dto.response.MarksResponse;
import com.finalYear.smartClassRoom.entity.*;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.MarksRepository;
import com.finalYear.smartClassRoom.repository.SemesterRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.repository.SubjectRepository;
import com.finalYear.smartClassRoom.service.MarksService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarksServiceImpl implements MarksService {

    private final MarksRepository marksRepository;
    private final StudentRepository studentRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;

    @Override
    @Transactional
    public MarksResponse addMarks(MarksRequest request) {

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", request.getStudentId()));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject", request.getSubjectId()));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", request.getSemesterId()));

        Marks marks = Marks.builder()
                .student(student)
                .subject(subject)
                .semester(semester)
                .examType(request.getExamType())
                .marksObtained(request.getMarksObtained())
                .maxMarks(request.getMaxMarks())
                .grade(request.getGrade())
                .remarks(request.getRemarks())
                .build();

        return toResponse(marksRepository.save(marks));
    }

    @Override
    @Transactional
    public MarksResponse updateMarks(Long id, MarksRequest request) {

        Marks marks = marksRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Marks", id));

        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", request.getStudentId()));

        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Subject", request.getSubjectId()));

        Semester semester = semesterRepository.findById(request.getSemesterId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", request.getSemesterId()));

        marks.setStudent(student);
        marks.setSubject(subject);
        marks.setSemester(semester);
        marks.setExamType(request.getExamType());
        marks.setMarksObtained(request.getMarksObtained());
        marks.setMaxMarks(request.getMaxMarks());
        marks.setGrade(request.getGrade());
        marks.setRemarks(request.getRemarks());

        return toResponse(marksRepository.save(marks));
    }

    @Override
    public List<MarksResponse> getStudentMarks(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", studentId));

        return marksRepository.findByStudent(student)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<MarksResponse> getStudentMarksBySemester(Long studentId, Long semesterId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", studentId));

        Semester semester = semesterRepository.findById(semesterId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Semester", semesterId));

        return marksRepository.findByStudentAndSemester(student, semester)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteMarks(Long id) {

        Marks marks = marksRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Marks", id));

        marksRepository.delete(marks);
    }

    private MarksResponse toResponse(Marks marks) {

        Double percentage = 0.0;

        if (marks.getMaxMarks() != null && marks.getMaxMarks() > 0) {
            percentage = (marks.getMarksObtained() / marks.getMaxMarks()) * 100;
        }

        return MarksResponse.builder()
                .id(marks.getId())

                .studentId(marks.getStudent().getId())
                .studentName(marks.getStudent().getFullName())
                .rollNumber(marks.getStudent().getRollNumber())

                .subjectId(marks.getSubject().getId())
                .subjectName(marks.getSubject().getName())

                .semesterId(marks.getSemester().getId())
                .semesterName(marks.getSemester().getName())

                .examType(marks.getExamType())
                .marksObtained(marks.getMarksObtained())
                .maxMarks(marks.getMaxMarks())
                .percentage(percentage)
                .grade(marks.getGrade())
                .remarks(marks.getRemarks())
                .build();
    }
}