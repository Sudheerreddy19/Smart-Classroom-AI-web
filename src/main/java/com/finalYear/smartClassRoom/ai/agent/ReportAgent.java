package com.finalYear.smartClassRoom.ai.agent;

import com.finalYear.smartClassRoom.ai.model.AgentRequest;
import com.finalYear.smartClassRoom.ai.model.AgentResponse;
import com.finalYear.smartClassRoom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ReportAgent extends BaseAgent {

    private final StudentRepository    studentRepository;
    private final TeacherRepository    teacherRepository;
    private final AttendanceSessionRepository sessionRepository;
    private final MarksRepository      marksRepository;
    private final DeviceRepository     deviceRepository;

    @Override
    public AgentResponse handle(AgentRequest request) {
        // Gather real data for report
        long students  = studentRepository.count();
        long teachers  = teacherRepository.count();
        long sessions  = sessionRepository.count();
        long marks     = marksRepository.count();
        long devices   = deviceRepository.count();
        double avgAtt  = sessionRepository.getAverageAttendanceRate();

        String dataCtx = String.format(
            "Institution Report Data — Students: %d, Teachers: %d, " +
            "Attendance Sessions: %d, Avg Attendance Rate: %.1f%%, " +
            "Marks Records: %d, Devices: %d.",
            students, teachers, sessions, avgAtt, marks, devices
        );

        String ollama = callOllama(
            "You are an institutional report generator for a Smart Classroom. " +
            "Generate concise, data-driven reports. Format with bullet points.",
            dataCtx + " Report request: " + request.getPrompt()
        );
        if (ollama != null) return AgentResponse.ollama(ollama, agentName());

        // Fallback formatted report
        String report = String.format("""
            Institutional Summary Report
            ============================
            • Total Students:        %d
            • Total Teachers:        %d
            • Attendance Sessions:   %d
            • Avg Attendance Rate:   %.1f%%
            • Marks Records:         %d
            • IoT Devices:           %d
            
            For detailed analytics, visit the Reports section in the dashboard.
            """, students, teachers, sessions, avgAtt, marks, devices);

        return AgentResponse.builder()
            .answer(report).agentName(agentName())
            .followUpQuestions(List.of(
                "Show attendance by department",
                "Which students are below 75% attendance?",
                "Show top performing subjects"
            )).build();
    }

    @Override protected String agentName() { return "ReportAgent"; }
}
