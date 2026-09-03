package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.StudentFace;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentFaceResponse {

    private Long id;

    private Long studentId;

    private String studentName;

    private String imagePath;

    private String encodingPath;

    private StudentFace.AngleType angleType;

    private boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}