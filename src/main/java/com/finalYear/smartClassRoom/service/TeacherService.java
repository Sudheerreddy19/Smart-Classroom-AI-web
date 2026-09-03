package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.TeacherRequest;
import com.finalYear.smartClassRoom.dto.response.TeacherResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TeacherService {

    TeacherResponse createTeacher(TeacherRequest request);

    TeacherResponse updateTeacher(Long id, TeacherRequest request);

    TeacherResponse getTeacherById(Long id);

    /**
     * Returns teachers visible to the caller.
     * SUPER_ADMIN/ADMIN can pass an optional departmentId to filter; HOD/TEACHER always
     * see only their own department regardless of the departmentId param.
     */
    Page<TeacherResponse> getAllTeachers(Pageable pageable, Long departmentId);

    void deleteTeacher(Long id);
}