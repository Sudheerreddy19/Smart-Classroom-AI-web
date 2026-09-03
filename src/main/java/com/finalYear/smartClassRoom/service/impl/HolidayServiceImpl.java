package com.finalYear.smartClassRoom.service.impl;

import com.finalYear.smartClassRoom.dto.request.HolidayRequest;
import com.finalYear.smartClassRoom.dto.response.HolidayResponse;
import com.finalYear.smartClassRoom.entity.Holiday;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.HolidayRepository;
import com.finalYear.smartClassRoom.service.CurrentUserContextService;
import com.finalYear.smartClassRoom.service.HolidayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HolidayServiceImpl implements HolidayService {

    private final HolidayRepository        holidayRepository;
    private final CurrentUserContextService currentUserCtx;

    @Override
    @Transactional
    public HolidayResponse addHoliday(HolidayRequest request) {
        Holiday holiday = Holiday.builder()
                .name(request.getName().trim())
                .date(request.getDate())
                .type(request.getType())
                .description(request.getDescription())
                .semesterNumber(request.getSemesterNumber())
                .active(true)
                .createdBy(currentUserCtx.getCaller())
                .build();

        holiday = holidayRepository.save(holiday);
        log.info("[Holiday] Added: {} on {} (type={})", holiday.getName(), holiday.getDate(), holiday.getType());
        return toResponse(holiday);
    }

    @Override
    @Transactional
    public HolidayResponse updateHoliday(Long id, HolidayRequest request) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", id));

        holiday.setName(request.getName().trim());
        holiday.setDate(request.getDate());
        holiday.setType(request.getType());
        holiday.setDescription(request.getDescription());
        holiday.setSemesterNumber(request.getSemesterNumber());

        holiday = holidayRepository.save(holiday);
        log.info("[Holiday] Updated id={}: {} on {}", id, holiday.getName(), holiday.getDate());
        return toResponse(holiday);
    }

    @Override
    @Transactional
    public void deleteHoliday(Long id) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", id));
        holidayRepository.delete(holiday);
        log.info("[Holiday] Deleted id={}: {}", id, holiday.getName());
    }

    @Override
    public List<HolidayResponse> getAllHolidays() {
        return holidayRepository.findByActiveTrue()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<HolidayResponse> getHolidaysBySemester(int semesterNumber) {
        return holidayRepository.findBySemesterNumberOrGlobal(semesterNumber)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<HolidayResponse> getHolidaysByType(String type) {
        Holiday.HolidayType holidayType;
        try {
            holidayType = Holiday.HolidayType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid holiday type: " + type +
                    ". Valid types: NATIONAL, PUBLIC, COLLEGE, EXAM, RESTRICTED");
        }
        return holidayRepository.findByTypeAndActiveTrue(holidayType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public List<HolidayResponse> addBulkHolidays(List<HolidayRequest> requests) {
        return requests.stream()
                .map(this::addHoliday)
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private HolidayResponse toResponse(Holiday h) {
        String typeLabel = switch (h.getType()) {
            case NATIONAL   -> "National Holiday";
            case PUBLIC     -> "Public Holiday";
            case COLLEGE    -> "College Holiday";
            case EXAM       -> "Exam Holiday";
            case RESTRICTED -> "Restricted Holiday";
        };
        return HolidayResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .date(h.getDate())
                .dayOfWeek(h.getDate().getDayOfWeek()
                        .getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                .type(h.getType())
                .typeLabel(typeLabel)
                .description(h.getDescription())
                .semesterNumber(h.getSemesterNumber())
                .active(h.isActive())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
