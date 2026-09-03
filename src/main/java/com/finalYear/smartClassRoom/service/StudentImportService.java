package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.response.StudentImportResult;
import com.finalYear.smartClassRoom.entity.User;
import org.springframework.web.multipart.MultipartFile;

public interface StudentImportService {
    StudentImportResult importFromExcel(MultipartFile file, User importedBy);
    byte[] generateExcelTemplate();
}
