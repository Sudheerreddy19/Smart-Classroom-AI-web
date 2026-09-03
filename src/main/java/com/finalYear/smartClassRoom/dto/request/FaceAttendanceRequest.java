package com.finalYear.smartClassRoom.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FaceAttendanceRequest {
    @NotNull(message = "Session ID is required")
    private Long sessionId;
    private String subjectLabel;
    private String teacherLabel;
    /** Base64-encoded JPEG frame captured from browser webcam (data:image/jpeg;base64,...) */
    private String imageBase64;
}

