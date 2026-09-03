package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.AttendanceSessionRequest;
import com.finalYear.smartClassRoom.dto.request.FaceAttendanceRequest;
import com.finalYear.smartClassRoom.dto.request.MarkAttendanceRequest;
import com.finalYear.smartClassRoom.dto.response.AttendanceResponse;
import com.finalYear.smartClassRoom.dto.response.AttendanceSessionResponse;
import com.finalYear.smartClassRoom.dto.response.FaceAttendanceResult;
import java.util.List;

import com.finalYear.smartClassRoom.entity.User;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public interface AttendanceService {

    AttendanceSessionResponse createSession(AttendanceSessionRequest request);

    AttendanceSessionResponse closeSession(Long sessionId);

    AttendanceResponse markAttendance(MarkAttendanceRequest request);

    List<AttendanceResponse> getSessionAttendance(Long sessionId);

    List<AttendanceSessionResponse> getTodaySessions();

    /** Calls Python face service to recognize a student, then marks them PRESENT */
    FaceAttendanceResult faceMarkAttendance(FaceAttendanceRequest request, User caller);

    /** Mark attendance for ALL faces detected in a single webcam frame. */
    List<FaceAttendanceResult> faceMarkAttendanceMulti(FaceAttendanceRequest request, User caller);


    /** Student-wise attendance % report filtered by dept/semester/subject/date range */
    List<Map<String, Object>> getAttendanceReport(Long departmentId, Long semesterId,
                                                   Long subjectId,
                                                   LocalDate from, LocalDate to);

    /** All sessions in a date range, optionally filtered by department */
    List<AttendanceSessionResponse> getSessionsInRange(Long departmentId,
                                                        LocalDate from, LocalDate to);
}