package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.ClassroomRequest;
import com.finalYear.smartClassRoom.dto.response.ClassroomResponse;

import java.util.List;

public interface ClassroomService {

    ClassroomResponse create(ClassroomRequest request);

    ClassroomResponse update(Long id, ClassroomRequest request);

    ClassroomResponse getById(Long id);

    List<ClassroomResponse> getAll();

    void delete(Long id);
}