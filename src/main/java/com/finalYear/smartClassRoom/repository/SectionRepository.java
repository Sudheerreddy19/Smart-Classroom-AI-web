package com.finalYear.smartClassRoom.repository;

import com.finalYear.smartClassRoom.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {

    List<Section> findByDepartment_IdAndSemester_Id(Long departmentId, Long semesterId);

    List<Section> findByDepartment_IdAndSemester_IdAndActiveTrue(Long departmentId, Long semesterId);

    Optional<Section> findByDepartment_IdAndSemester_IdAndNameIgnoreCase(
            Long departmentId, Long semesterId, String name);

    /** Find or prepare to create a section by dept + semester + name */
    boolean existsByDepartment_IdAndSemester_IdAndNameIgnoreCase(
            Long departmentId, Long semesterId, String name);
}
