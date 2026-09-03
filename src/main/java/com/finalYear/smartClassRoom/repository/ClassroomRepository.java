package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClassroomRepository extends JpaRepository<Classroom, Long> {

    Optional<Classroom> findByRoomNumber(String roomNumber);

    boolean existsByRoomNumber(String roomNumber);

    List<Classroom> findByActiveTrue();

    Optional<Classroom> findByCameraId(String cameraId);

    Optional<Classroom> findByEsp32Id(String esp32Id);

    long countByActiveTrue();

    /** Find all classrooms whose roomNumber starts with the dept prefix (e.g. "CSE-") */
    List<Classroom> findByRoomNumberStartingWithAndActiveTrue(String prefix);

    /** Count how many students are assigned to a specific classroom */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.classroom.id = :classroomId AND s.active = true")
    long countStudentsByClassroomId(@org.springframework.data.repository.query.Param("classroomId") Long classroomId);
}