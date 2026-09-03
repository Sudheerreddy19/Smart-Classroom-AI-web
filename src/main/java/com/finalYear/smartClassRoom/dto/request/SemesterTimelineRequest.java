package com.finalYear.smartClassRoom.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SemesterTimelineRequest {
    private LocalDate startDate;
    private LocalDate endDate;
    /** If true, apply these dates to the same semester number across ALL departments. */
    private boolean applyToAll = false;
}
