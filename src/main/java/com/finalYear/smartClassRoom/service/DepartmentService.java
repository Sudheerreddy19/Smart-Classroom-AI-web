package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.DepartmentRequest;
import com.finalYear.smartClassRoom.dto.response.DepartmentResponse;

import java.util.List;

public interface DepartmentService {

    DepartmentResponse create(DepartmentRequest request);

    DepartmentResponse update(Long id, DepartmentRequest request);

    DepartmentResponse getById(Long id);

    List<DepartmentResponse> getAll();

    void delete(Long id);
}