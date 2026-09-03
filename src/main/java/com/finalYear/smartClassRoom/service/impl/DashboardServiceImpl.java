package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.response.DashboardResponse;
import com.finalYear.smartClassRoom.entity.Device;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.*;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final DepartmentRepository departmentRepository;
    private final ClassroomRepository classroomRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final DeviceRepository deviceRepository;
    private final CurrentUserContextService currentUserCtx;

    @Override
    public DashboardResponse getDashboardStats() {
        User.Role role = currentUserCtx.getCallerRole();

        long totalStudents;
        long totalTeachers;
        long totalDepartments = departmentRepository.count();
        long todayAttendanceSessions;

        if (role == User.Role.HOD || role == User.Role.TEACHER || role == User.Role.STUDENT) {
            // Dept-scoped counts
            Long deptId = currentUserCtx.getCallerDepartmentId();
            if (deptId != null) {
                totalStudents = studentRepository.countByDepartment_Id(deptId);
                totalTeachers = teacherRepository.countByDepartment_IdAndActiveTrue(deptId);
                todayAttendanceSessions = attendanceSessionRepository
                        .countTodaySessionsByDepartment(deptId);
                // For department-scoped dashboard, show only their dept count
                totalDepartments = 1L;
            } else {
                // fallback: no dept assigned — show zeros for restricted counts
                totalStudents = 0;
                totalTeachers = 0;
                todayAttendanceSessions = 0;
            }
        } else {
            // SUPER_ADMIN / ADMIN — global counts
            totalStudents = studentRepository.count();
            totalTeachers = teacherRepository.count();
            todayAttendanceSessions = attendanceSessionRepository.countTodaySessions();
        }

        long activeClassrooms = classroomRepository.countByActiveTrue();

        long onlineDevices = deviceRepository.countByStatus(Device.DeviceStatus.ONLINE);
        long offlineDevices = deviceRepository.countByStatus(Device.DeviceStatus.OFFLINE);

        double avgAttendanceRate = attendanceSessionRepository.getAverageAttendanceRate();

        Map<String, Object> environmentSummary = new HashMap<>();
        environmentSummary.put("temperature", 0);
        environmentSummary.put("humidity", 0);
        environmentSummary.put("airQuality", "N/A");
        environmentSummary.put("lightLevel", 0);

        return DashboardResponse.builder()
                .totalStudents(totalStudents)
                .totalTeachers(totalTeachers)
                .totalDepartments(totalDepartments)
                .activeClassrooms(activeClassrooms)
                .todayAttendanceSessions(todayAttendanceSessions)
                .onlineDevices(onlineDevices)
                .offlineDevices(offlineDevices)
                .avgAttendanceRate(avgAttendanceRate)
                .environmentSummary(environmentSummary)
                .build();
    }
}