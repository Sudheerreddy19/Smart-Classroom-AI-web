package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.response.StudentFaceResponse;
import com.finalYear.smartClassRoom.entity.StudentFace;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StudentFaceService {

    StudentFaceResponse registerFace(
            Long studentId,
            MultipartFile image,
            StudentFace.AngleType angleType
    );

    List<StudentFaceResponse> getStudentFaces(Long studentId);

    void deleteFace(Long faceId);

}