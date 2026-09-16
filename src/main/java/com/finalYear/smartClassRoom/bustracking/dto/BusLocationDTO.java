package com.finalYear.smartClassRoom.bustracking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusLocationDTO {
    private String busNumber;          // e.g. "AP39Z 0123"
    private String routeId;            // e.g. "14701"
    private String vehicleId;          // e.g. "4851"
    private String sourceName;         // e.g. "Guntur"
    private String destinationName;    // e.g. "Amaravati"
    private String routeName;          // e.g. "Guntur → Amaravati"
    private Double latitude;           // e.g. 16.340996
    private Double longitude;          // e.g. 80.489543
    private Double speedKmph;          // e.g. 38.0
    private Double bearing;            // heading in degrees
    private String direction;          // e.g. "North-East"
    private String nextStop;           // e.g. "Mangalagiri"
    private String status;             // e.g. "On Time", "Live"
    private String lastUpdated;        // e.g. "2 mins ago"
    private Boolean isOnline;          // true
    private LocalDateTime timestamp;
}
