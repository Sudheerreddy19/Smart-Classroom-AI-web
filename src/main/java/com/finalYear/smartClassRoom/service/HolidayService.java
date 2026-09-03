package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.HolidayRequest;
import com.finalYear.smartClassRoom.dto.response.HolidayResponse;

import java.util.List;

public interface HolidayService {

    HolidayResponse addHoliday(HolidayRequest request);

    HolidayResponse updateHoliday(Long id, HolidayRequest request);

    void deleteHoliday(Long id);

    List<HolidayResponse> getAllHolidays();

    List<HolidayResponse> getHolidaysBySemester(int semesterNumber);

    List<HolidayResponse> getHolidaysByType(String type);

    List<HolidayResponse> addBulkHolidays(List<HolidayRequest> requests);
}
