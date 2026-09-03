package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.response.StudentFaceResponse;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.StudentFace;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.StudentFaceRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.service.StudentFaceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentFaceServiceImpl implements StudentFaceService {

    private final StudentRepository studentRepository;
    private final StudentFaceRepository studentFaceRepository;

    @Value("${app.face-recognition.images-path:faces}")
    private String imageStoragePath;

    @Override
    @Transactional
    public StudentFaceResponse registerFace(Long studentId,
                                            MultipartFile image,
                                            StudentFace.AngleType angleType) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", studentId));

        try {

            Path folder = Paths.get(imageStoragePath, studentId.toString());

            if (!Files.exists(folder)) {
                Files.createDirectories(folder);
            }

            String fileName =
                    UUID.randomUUID() + "_" + angleType.name() + ".jpg";

            Path imagePath = folder.resolve(fileName);

            Files.write(imagePath, image.getBytes());

            StudentFace face = StudentFace.builder()
                    .student(student)
                    .imagePath(imagePath.toString())
                    .angleType(angleType)
                    .active(true)
                    .build();

            face = studentFaceRepository.save(face);

            log.info("Face registered for student {}", studentId);

            return toResponse(face);

        } catch (IOException ex) {
            throw new RuntimeException("Unable to save face image", ex);
        }
    }

    @Override
    public List<StudentFaceResponse> getStudentFaces(Long studentId) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Student", studentId));

        return studentFaceRepository
                .findByStudentAndActiveTrue(student)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteFace(Long faceId) {

        StudentFace face = studentFaceRepository.findById(faceId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("StudentFace", faceId));

        face.setActive(false);

        studentFaceRepository.save(face);

        log.info("Face deleted {}", faceId);
    }

    private StudentFaceResponse toResponse(StudentFace face) {

        return StudentFaceResponse.builder()
                .id(face.getId())

                .studentId(face.getStudent().getId())

                .studentName(
                        face.getStudent().getFullName()
                )

                .imagePath(face.getImagePath())

                .encodingPath(face.getEncodingPath())

                .angleType(face.getAngleType())

                .active(face.isActive())

                .createdAt(face.getCreatedAt())

                .build();
    }
}