package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentFaceRepository extends JpaRepository<StudentFace, Long> {

    List<StudentFace> findByStudent(Student student);

    List<StudentFace> findByStudentAndActiveTrue(Student student);

    List<StudentFace> findByAngleType(StudentFace.AngleType angleType);

    List<StudentFace> findByActiveTrue();

    /** Delete all face records for a student — used before re-capture to prevent duplicates */
    void deleteByStudent(Student student);

    /** Check if any face record exists for a student */
    boolean existsByStudent(Student student);

}