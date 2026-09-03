package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.SubjectRequest;
import com.finalYear.smartClassRoom.dto.response.SubjectResponse;

import java.util.List;

public interface SubjectService {

    SubjectResponse create(SubjectRequest request);

    SubjectResponse update(Long id, SubjectRequest request);

    SubjectResponse getById(Long id);

    List<SubjectResponse> getAll();

    List<SubjectResponse> getBySemester(Long semesterId);

    void delete(Long id);
}