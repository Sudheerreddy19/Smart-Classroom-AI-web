package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.SemesterRequest;
import com.finalYear.smartClassRoom.dto.response.SemesterResponse;

import java.time.LocalDate;
import java.util.List;

public interface SemesterService {

    SemesterResponse create(SemesterRequest request);

    SemesterResponse update(Long id, SemesterRequest request);

    /** Patch only the start/end dates — does NOT require full request body. */
    SemesterResponse updateTimeline(Long id, LocalDate startDate, LocalDate endDate);

    /** Apply one semester number's dates to that same semester across ALL departments. */
    int applyTimelineToAllDepts(int semesterNumber, LocalDate startDate, LocalDate endDate);

    SemesterResponse getById(Long id);

    List<SemesterResponse> getAll();

    List<SemesterResponse> getByDepartment(Long departmentId);

    void delete(Long id);
}