package com.finalYear.smartClassRoom.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportRow {
    private String rollNumber;
    private String admissionNumber;
    private String firstName;
    private String lastName;
    private String department;
    private String branch;
    private String year;
    private int semester;
    private String section;
    private String dateOfBirth; // dd-MM-yyyy
    private String officialEmail;
}
