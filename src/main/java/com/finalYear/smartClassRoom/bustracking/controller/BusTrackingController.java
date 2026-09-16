package com.finalYear.smartClassRoom.bustracking.controller;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;
import com.finalYear.smartClassRoom.bustracking.service.BusTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bus-tracking")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('STUDENT')")
public class BusTrackingController {

    private final BusTrackingService busTrackingService;

    @GetMapping("/places")
    public ResponseEntity<List<Map<String, Object>>> searchPlaces(
            @RequestParam(value = "query", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(busTrackingService.searchPlaces(query));
    }

    @PostMapping("/services")
    public ResponseEntity<List<?>> getServices(@RequestBody Map<String, String> body) {
        String src = body.get("sourcePlaceId");
        String dest = body.get("destinationPlaceId");
        String srcLink = body.getOrDefault("sourceLinkId", src);
        String destLink = body.getOrDefault("destinationLinkId", dest);

        return ResponseEntity.ok(busTrackingService.getServices(src, dest, srcLink, destLink));
    }

    @PostMapping("/start-tracking")
    public ResponseEntity<Map<?, ?>> startTracking(@RequestBody Map<String, Object> body) {
        String routeKey = String.valueOf(body.get("routeKey"));
        int refreshInterval = body.get("refreshIntervalMs") != null
                ? Integer.parseInt(String.valueOf(body.get("refreshIntervalMs")))
                : 5000;
        return ResponseEntity.ok(busTrackingService.startTracking(routeKey, refreshInterval));
    }

    @GetMapping("/live/{routeKey}")
    public ResponseEntity<List<BusLocationDTO>> getLiveTracking(@PathVariable String routeKey) {
        return ResponseEntity.ok(busTrackingService.getLiveTracking(routeKey));
    }

    @GetMapping("/polyline/{serviceDocId}")
    public ResponseEntity<List<double[]>> getRoutePolyline(@PathVariable String serviceDocId) {
        return ResponseEntity.ok(busTrackingService.getRoutePolyline(serviceDocId));
    }

    @GetMapping("/buses")
    public ResponseEntity<List<BusLocationDTO>> getActiveBuses() {
        return ResponseEntity.ok(busTrackingService.getActiveBuses());
    }

    @GetMapping("/buses/{busNumber}")
    public ResponseEntity<BusLocationDTO> getBusByNumber(@PathVariable String busNumber) {
        BusLocationDTO bus = busTrackingService.getBusByNumber(busNumber);
        if (bus == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(bus);
    }
}
