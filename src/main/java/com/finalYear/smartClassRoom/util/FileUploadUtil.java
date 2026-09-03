package com.finalYear.smartClassRoom.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class FileUploadUtil {

    private FileUploadUtil() {}

    public static String saveFile(
            String uploadDir,
            MultipartFile file) throws IOException {

        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {

            Files.createDirectories(uploadPath);

        }

        Path filePath = uploadPath.resolve(file.getOriginalFilename());

        Files.copy(file.getInputStream(), filePath);

        return filePath.toString();
    }
}