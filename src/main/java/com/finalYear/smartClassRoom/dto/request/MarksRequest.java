package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.Marks;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MarksRequest {

    @NotNull(message = "Student is required")
    private Long studentId;

    @NotNull(message = "Subject is required")
    private Long subjectId;

    @NotNull(message = "Semester is required")
    private Long semesterId;

    @NotNull(message = "Exam type is required")
    private Marks.ExamType examType;

    @NotNull(message = "Marks obtained is required")
    @DecimalMin(value = "0.0", message = "Marks cannot be negative")
    private Double marksObtained;

    @NotNull(message = "Maximum marks is required")
    @DecimalMin(value = "1.0", message = "Maximum marks must be greater than zero")
    private Double maxMarks;

    private String grade;

    private String remarks;
}