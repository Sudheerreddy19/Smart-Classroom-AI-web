package com.finalYear.smartClassRoom.bustracking.service.impl;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;
import com.finalYear.smartClassRoom.bustracking.provider.APSRTCTransitProvider;
import com.finalYear.smartClassRoom.bustracking.provider.CampusTransitProvider;
import com.finalYear.smartClassRoom.bustracking.service.BusTrackingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BusTrackingServiceImpl implements BusTrackingService {

    private final APSRTCTransitProvider apsrtcProvider;
    private final CampusTransitProvider campusProvider;

    @Override
    public List<Map<String, Object>> searchPlaces(String query) {
        return apsrtcProvider.searchPlaces(query);
    }

    @Override
    public List<?> getServices(String sourcePlaceId, String destinationPlaceId, String sourceLinkId, String destinationLinkId) {
        return apsrtcProvider.getServices(sourcePlaceId, destinationPlaceId, sourceLinkId, destinationLinkId);
    }

    @Override
    public Map<?, ?> startTracking(String routeKey, int refreshIntervalMs) {
        return apsrtcProvider.startTrackingBulk(routeKey, refreshIntervalMs);
    }

    @Override
    public List<BusLocationDTO> getLiveTracking(String routeKey) {
        List<BusLocationDTO> list = apsrtcProvider.getRealtimeBusesForRoute(routeKey);
        if (list == null || list.isEmpty()) {
            // If real-time API returned 0 buses at night or off-hours, fallback to campus simulator so map is never broken
            return campusProvider.getActiveBuses();
        }
        return list;
    }

    @Override
    public List<double[]> getRoutePolyline(String serviceDocId) {
        List<double[]> points = apsrtcProvider.getRoutePolyline(serviceDocId);
        if (points == null || points.isEmpty()) {
            return campusProvider.getRoutePolyline(serviceDocId);
        }
        return points;
    }

    @Override
    public List<BusLocationDTO> getActiveBuses() {
        return getLiveTracking("14701_4851");
    }

    @Override
    public BusLocationDTO getBusByNumber(String busNumber) {
        return getActiveBuses().stream()
                .filter(b -> b.getBusNumber().replace(" ", "").equalsIgnoreCase(busNumber.replace(" ", "")))
                .findFirst()
                .orElse(null);
    }
}
