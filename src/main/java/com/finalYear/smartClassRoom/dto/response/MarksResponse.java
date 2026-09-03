package com.finalYear.smartClassRoom.dto.response;

import com.finalYear.smartClassRoom.entity.Marks;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarksResponse {

    private Long id;

    private Long studentId;

    private String studentName;

    private String rollNumber;

    private Long subjectId;

    private String subjectName;

    private Long semesterId;

    private String semesterName;

    private Marks.ExamType examType;

    private Double marksObtained;

    private Double maxMarks;

    private Double percentage;

    private String grade;

    private String remarks;

    private boolean passed;

}