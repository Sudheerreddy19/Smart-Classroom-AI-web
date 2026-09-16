package com.finalYear.smartClassRoom.bustracking.service;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;

import java.util.List;
import java.util.Map;

public interface BusTrackingService {
    List<Map<String, Object>> searchPlaces(String query);
    List<?> getServices(String sourcePlaceId, String destinationPlaceId, String sourceLinkId, String destinationLinkId);
    Map<?, ?> startTracking(String routeKey, int refreshIntervalMs);
    List<BusLocationDTO> getLiveTracking(String routeKey);
    List<double[]> getRoutePolyline(String serviceDocId);

    // Default active buses
    List<BusLocationDTO> getActiveBuses();
    BusLocationDTO getBusByNumber(String busNumber);
}
