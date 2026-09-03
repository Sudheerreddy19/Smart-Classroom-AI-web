package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.MarksRequest;
import com.finalYear.smartClassRoom.dto.response.MarksResponse;

import java.util.List;

public interface MarksService {

    MarksResponse addMarks(MarksRequest request);

    MarksResponse updateMarks(Long id, MarksRequest request);

    List<MarksResponse> getStudentMarks(Long studentId);

    List<MarksResponse> getStudentMarksBySemester(Long studentId,
                                                  Long semesterId);

    void deleteMarks(Long id);
}