package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.ClassroomRequest;
import com.finalYear.smartClassRoom.dto.response.ClassroomResponse;
import com.finalYear.smartClassRoom.entity.Classroom;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.ClassroomRepository;
import com.finalYear.smartClassRoom.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;

    @Override
    @Transactional
    public ClassroomResponse create(ClassroomRequest request) {

        if (classroomRepository.existsByRoomNumber(request.getRoomNumber())) {
            throw new DuplicateResourceException(
                    "Classroom already exists with room number: "
                            + request.getRoomNumber()
            );
        }

        Classroom classroom = Classroom.builder()
                .roomNumber(request.getRoomNumber())
                .capacity(request.getCapacity())
                .cameraId(request.getCameraId())
                .esp32Id(request.getEsp32Id())
                .projectorId(request.getProjectorId())
                .microphoneId(request.getMicrophoneId())
                .speakerId(request.getSpeakerId())
                .active(true)
                .build();

        classroom = classroomRepository.save(classroom);

        log.info("Classroom created: {}", classroom.getRoomNumber());

        return toResponse(classroom);
    }

    @Override
    @Transactional
    public ClassroomResponse update(Long id, ClassroomRequest request) {

        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Classroom", id));

        classroom.setRoomNumber(request.getRoomNumber());
        classroom.setCapacity(request.getCapacity());
        classroom.setCameraId(request.getCameraId());
        classroom.setEsp32Id(request.getEsp32Id());
        classroom.setProjectorId(request.getProjectorId());
        classroom.setMicrophoneId(request.getMicrophoneId());
        classroom.setSpeakerId(request.getSpeakerId());

        classroom = classroomRepository.save(classroom);

        return toResponse(classroom);
    }

    @Override
    public ClassroomResponse getById(Long id) {

        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Classroom", id));

        return toResponse(classroom);
    }

    @Override
    public List<ClassroomResponse> getAll() {

        return classroomRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {

        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Classroom", id));

        classroom.setActive(false);

        classroomRepository.save(classroom);

        log.info("Classroom deactivated: {}", classroom.getRoomNumber());
    }

    private ClassroomResponse toResponse(Classroom classroom) {

        return ClassroomResponse.builder()
                .id(classroom.getId())
                .roomNumber(classroom.getRoomNumber())
                .capacity(classroom.getCapacity())
                .cameraId(classroom.getCameraId())
                .esp32Id(classroom.getEsp32Id())
                .projectorId(classroom.getProjectorId())
                .microphoneId(classroom.getMicrophoneId())
                .speakerId(classroom.getSpeakerId())
                .active(classroom.isActive())
                .createdAt(classroom.getCreatedAt())
                .updatedAt(classroom.getUpdatedAt())
                .build();
    }
}