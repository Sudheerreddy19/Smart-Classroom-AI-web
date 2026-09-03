package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.TimetableRequest;
import com.finalYear.smartClassRoom.dto.response.TimetableResponse;

import java.util.List;

public interface TimetableService {

    TimetableResponse create(TimetableRequest request);

    TimetableResponse update(Long id, TimetableRequest request);

    TimetableResponse getById(Long id);

    List<TimetableResponse> getAll();

    List<TimetableResponse> getByClassroom(Long classroomId);

    List<TimetableResponse> getByTeacher(Long teacherId);

    void delete(Long id);

    /** Create multiple timetable slots in one transaction (from builder wizard) */
    List<TimetableResponse> bulkCreate(List<TimetableRequest> requests);

    /** Get all timetable slots for a specific section */
    List<TimetableResponse> getBySection(Long sectionId);

    /** Delete all slots for a section (before re-building) */
    void deleteBySection(Long sectionId);
}