package com.finalYear.smartClassRoom.bustracking.provider;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component("campusTransitProvider")
public class CampusTransitProvider implements TransitProvider {

    // High-resolution polyline coordinates along Guntur - Mangalagiri - Vijayawada - Amaravati
    private static final List<double[]> MAIN_ROUTE = Arrays.asList(
            new double[]{16.296939, 80.456366}, // Guntur Bus Station
            new double[]{16.323616, 80.479425},
            new double[]{16.340996, 80.489543},
            new double[]{16.375000, 80.515000},
            new double[]{16.434500, 80.563200}, // Mangalagiri
            new double[]{16.470000, 80.590000},
            new double[]{16.508894, 80.616597}, // Vijayawada
            new double[]{16.535000, 80.530000}  // Amaravati
    );

    @Override
    public String getProviderName() {
        return "CAMPUS_REALTIME";
    }

    @Override
    public boolean isAvailable() {
        return true; // Always resilient and available
    }

    @Override
    public List<BusLocationDTO> getActiveBuses() {
        long sec = System.currentTimeMillis() / 1000;
        double progress = (sec % 300) / 300.0; // 5-minute continuous loop along the route

        // Calculate interpolated point along route
        int segCount = MAIN_ROUTE.size() - 1;
        double totalIndex = progress * segCount;
        int currentSegment = Math.min((int) totalIndex, segCount - 1);
        double segFrac = totalIndex - currentSegment;

        double[] p1 = MAIN_ROUTE.get(currentSegment);
        double[] p2 = MAIN_ROUTE.get(currentSegment + 1);

        double curLat = p1[0] + (p2[0] - p1[0]) * segFrac;
        double curLng = p1[1] + (p2[1] - p1[1]) * segFrac;

        List<BusLocationDTO> buses = new ArrayList<>();

        // Bus 1 (Featured in user design)
        buses.add(BusLocationDTO.builder()
                .busNumber("AP39Z 0123")
                .routeId("14701")
                .vehicleId("4851")
                .sourceName("Guntur")
                .destinationName("Amaravati")
                .routeName("Guntur → Amaravati")
                .latitude(curLat)
                .longitude(curLng)
                .speedKmph(38.0 + (Math.sin(sec / 10.0) * 4))
                .bearing(45.0)
                .direction("North-East")
                .nextStop("Mangalagiri")
                .status("On Time")
                .lastUpdated("Just now")
                .isOnline(true)
                .timestamp(LocalDateTime.now())
                .build());

        // Bus 2
        buses.add(BusLocationDTO.builder()
                .busNumber("AP39Z 0456")
                .routeId("14702")
                .vehicleId("4852")
                .sourceName("Guntur")
                .destinationName("Vijayawada")
                .routeName("Guntur → Vijayawada")
                .latitude(16.4345 + (Math.sin(sec / 40.0) * 0.02))
                .longitude(80.5632 + (Math.cos(sec / 40.0) * 0.02))
                .speedKmph(42.0)
                .bearing(60.0)
                .direction("East")
                .nextStop("Vijayawada Junction")
                .status("On Time")
                .lastUpdated("1 min ago")
                .isOnline(true)
                .timestamp(LocalDateTime.now())
                .build());

        // Bus 3
        buses.add(BusLocationDTO.builder()
                .busNumber("AP39Z 0789")
                .routeId("14703")
                .vehicleId("4853")
                .sourceName("Tenali")
                .destinationName("Guntur")
                .routeName("Tenali → Guntur")
                .latitude(16.2430 + (Math.sin(sec / 50.0) * 0.015))
                .longitude(80.6400 - (Math.cos(sec / 50.0) * 0.015))
                .speedKmph(35.0)
                .bearing(300.0)
                .direction("North-West")
                .nextStop("Autonagar")
                .status("On Time")
                .lastUpdated("3 mins ago")
                .isOnline(true)
                .timestamp(LocalDateTime.now())
                .build());

        // Bus 4
        buses.add(BusLocationDTO.builder()
                .busNumber("AP39Z 0999")
                .routeId("14704")
                .vehicleId("4854")
                .sourceName("Mangalagiri")
                .destinationName("Guntur")
                .routeName("Mangalagiri → Guntur")
                .latitude(16.3800 - (Math.sin(sec / 45.0) * 0.02))
                .longitude(80.5100 - (Math.cos(sec / 45.0) * 0.02))
                .speedKmph(40.0)
                .bearing(220.0)
                .direction("South-West")
                .nextStop("Pedakakani")
                .status("On Time")
                .lastUpdated("2 mins ago")
                .isOnline(true)
                .timestamp(LocalDateTime.now())
                .build());

        // Bus 5
        buses.add(BusLocationDTO.builder()
                .busNumber("AP39Z 0666")
                .routeId("14705")
                .vehicleId("4855")
                .sourceName("Guntur")
                .destinationName("Bapatla")
                .routeName("Guntur → Bapatla")
                .latitude(16.1500 + (Math.sin(sec / 60.0) * 0.01))
                .longitude(80.4700 + (Math.cos(sec / 60.0) * 0.01))
                .speedKmph(33.0)
                .bearing(180.0)
                .direction("South")
                .nextStop("Ponnur")
                .status("On Time")
                .lastUpdated("1 min ago")
                .isOnline(true)
                .timestamp(LocalDateTime.now())
                .build());

        return buses;
    }

    @Override
    public BusLocationDTO getBusLocation(String busNumber) {
        return getActiveBuses().stream()
                .filter(b -> b.getBusNumber().replace(" ", "").equalsIgnoreCase(busNumber.replace(" ", "")))
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<double[]> getRoutePolyline(String routeId) {
        return new ArrayList<>(MAIN_ROUTE);
    }
}
