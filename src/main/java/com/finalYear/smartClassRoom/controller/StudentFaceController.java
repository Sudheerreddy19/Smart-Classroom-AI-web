package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.response.StudentFaceResponse;
import com.finalYear.smartClassRoom.entity.StudentFace;
import com.finalYear.smartClassRoom.service.StudentFaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/student-faces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentFaceController {

    private final StudentFaceService studentFaceService;

    @PostMapping("/{studentId}")
    public ResponseEntity<StudentFaceResponse> uploadFace(
            @PathVariable Long studentId,
            @RequestParam MultipartFile image,
            @RequestParam StudentFace.AngleType angleType) {

        return ResponseEntity.ok(
                studentFaceService.registerFace(
                        studentId,
                        image,
                        angleType));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<List<StudentFaceResponse>> getFaces(
            @PathVariable Long studentId) {

        return ResponseEntity.ok(
                studentFaceService.getStudentFaces(studentId));
    }

    @DeleteMapping("/{faceId}")
    public ResponseEntity<String> deleteFace(
            @PathVariable Long faceId) {

        studentFaceService.deleteFace(faceId);

        return ResponseEntity.ok("Face deleted successfully.");
    }
}