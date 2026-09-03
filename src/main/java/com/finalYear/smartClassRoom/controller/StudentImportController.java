package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.response.StudentImportResult;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.StudentImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentImportController {

    private final StudentImportService studentImportService;
    private final CurrentUserContextService currentUserContextService;

    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
    public ResponseEntity<StudentImportResult> importStudents(@RequestParam("file") MultipartFile file) {
        User caller = currentUserContextService.getCaller();
        return ResponseEntity.ok(studentImportService.importFromExcel(file, caller));
    }

    @GetMapping("/template")
    public ResponseEntity<ByteArrayResource> downloadTemplate() {
        byte[] template = studentImportService.generateExcelTemplate();
        ByteArrayResource resource = new ByteArrayResource(template);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student_import_template.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }
}
