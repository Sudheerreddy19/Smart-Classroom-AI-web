package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private long totalStudents;
    private long totalTeachers;
    private long totalDepartments;
    private long totalClassrooms;
    private long activeClassrooms;
    private long todayAttendanceSessions;
    private long totalPresentStudents;
    private double averageAttendancePercentage;
    private long totalDevices;
    private long onlineDevices;
    private long offlineDevices;
    private double avgAttendanceRate;

    private Map<String, Object> environmentSummary;
}