package com.finalYear.smartClassRoom.bustracking.provider;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;

import java.util.List;

public interface TransitProvider {
    String getProviderName();
    boolean isAvailable();
    List<BusLocationDTO> getActiveBuses();
    BusLocationDTO getBusLocation(String busNumber);
    List<double[]> getRoutePolyline(String routeId);
}
