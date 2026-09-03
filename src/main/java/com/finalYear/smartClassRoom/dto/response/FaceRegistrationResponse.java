package com.finalYear.smartClassRoom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegistrationResponse {
    private Long studentId;
    private String rollNumber;
    private String studentName;
    private boolean success;
    private int imagesCaptured;
    private String encodingPath;
    private String message;
    private LocalDateTime capturedAt;
}
