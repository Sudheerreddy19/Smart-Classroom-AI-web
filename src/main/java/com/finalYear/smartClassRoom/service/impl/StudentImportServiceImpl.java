package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.StudentImportRow;
import com.finalYear.smartClassRoom.dto.response.StudentImportResult;
import com.finalYear.smartClassRoom.entity.Department;
import com.finalYear.smartClassRoom.entity.Section;
import com.finalYear.smartClassRoom.entity.Semester;
import com.finalYear.smartClassRoom.entity.Student;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.repository.DepartmentRepository;
import com.finalYear.smartClassRoom.repository.SectionRepository;
import com.finalYear.smartClassRoom.repository.SemesterRepository;
import com.finalYear.smartClassRoom.repository.StudentRepository;
import com.finalYear.smartClassRoom.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentImportServiceImpl implements StudentImportService {

    private final StudentRepository studentRepository;
    private final DepartmentRepository departmentRepository;
    private final SemesterRepository semesterRepository;
    private final SectionRepository sectionRepository;

    @Override
    @Transactional
    public StudentImportResult importFromExcel(MultipartFile file, User importedBy) {
        StudentImportResult result = new StudentImportResult(0, 0, 0, 0, new ArrayList<>());

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            boolean isHeader = true;

            for (Row row : sheet) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                result.setTotalRows(result.getTotalRows() + 1);
                
                try {
                    String rollNumber = getCellValue(row.getCell(0));
                    if (rollNumber == null || rollNumber.trim().isEmpty()) {
                        continue;
                    }
                    
                    if (studentRepository.existsByRollNumber(rollNumber)) {
                        result.setSkipped(result.getSkipped() + 1);
                        result.getErrors().add("Row " + row.getRowNum() + ": Roll number " + rollNumber + " already exists.");
                        continue;
                    }

                    String admissionNumber = getCellValue(row.getCell(1));
                    String firstName = getCellValue(row.getCell(2));
                    String lastName = getCellValue(row.getCell(3));
                    String deptName = getCellValue(row.getCell(4));
                    String branch = getCellValue(row.getCell(5));
                    String year = getCellValue(row.getCell(6));
                    String semStr = getCellValue(row.getCell(7));
                    String sectionName = getCellValue(row.getCell(8));
                    String dobStr = getCellValue(row.getCell(9));
                    String email = getCellValue(row.getCell(10));
                    
                    int semesterNum = Integer.parseInt(semStr);
                    
                    Department department = departmentRepository.findByName(deptName)
                            .orElseGet(() -> {
                                Department newDept = new Department();
                                newDept.setName(deptName);
                                return departmentRepository.save(newDept);
                            });
                            
                    Semester semester = semesterRepository.findByDepartment_IdAndNumber(department.getId(), semesterNum)
                            .orElseGet(() -> {
                                Semester newSem = new Semester();
                                newSem.setDepartment(department);
                                newSem.setNumber(semesterNum);
                                newSem.setName("Semester " + semesterNum);
                                newSem.setActive(true);
                                return semesterRepository.save(newSem);
                            });
                            
                    Section section = sectionRepository.findByDepartment_IdAndSemester_IdAndNameIgnoreCase(department.getId(), semester.getId(), sectionName)
                            .orElseGet(() -> {
                                Section newSec = new Section();
                                newSec.setDepartment(department);
                                newSec.setSemester(semester);
                                newSec.setName(sectionName);
                                return sectionRepository.save(newSec);
                            });

                    LocalDate dateOfBirth = null;
                    try {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                        dateOfBirth = LocalDate.parse(dobStr, formatter);
                    } catch (DateTimeParseException e) {
                        result.setFailed(result.getFailed() + 1);
                        result.getErrors().add("Row " + row.getRowNum() + ": Invalid DOB format. Use dd-MM-yyyy.");
                        continue;
                    }
                    
                    Student student = Student.builder()
                            .rollNumber(rollNumber.trim().toUpperCase())
                            .admissionNumber(admissionNumber)
                            .firstName(firstName)
                            .lastName(lastName)
                            .officialEmail(email)
                            .dateOfBirth(dateOfBirth)
                            .department(department)
                            .semester(semester)
                            .section(section)
                            .branch(branch)
                            .academicYear(year)
                            .registrationStatus(Student.RegistrationStatus.NOT_REGISTERED)
                            .active(true)
                            .build();

                    studentRepository.save(student);
                    result.setImported(result.getImported() + 1);

                } catch (Exception e) {
                    result.setFailed(result.getFailed() + 1);
                    result.getErrors().add("Row " + row.getRowNum() + ": Error - " + e.getMessage());
                }
            }
        } catch (IOException e) {
            log.error("Failed to parse Excel file", e);
            throw new RuntimeException("Failed to parse Excel file", e);
        }

        return result;
    }

    @Override
    public byte[] generateExcelTemplate() {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Students");
            Row headerRow = sheet.createRow(0);
            
            String[] headers = {
                "Roll Number", "Admission Number", "First Name", "Last Name",
                "Department", "Branch", "Year", "Semester", "Section",
                "Date of Birth (dd-MM-yyyy)", "Official Email"
            };
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate Excel template", e);
            throw new RuntimeException("Failed to generate Excel template", e);
        }
    }
    
    private String getCellValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getLocalDateTimeCellValue().format(DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                }
                yield String.valueOf((long) cell.getNumericCellValue());
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> "";
        };
    }
}
