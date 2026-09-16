package com.finalYear.smartClassRoom.bustracking.provider;

import com.finalYear.smartClassRoom.bustracking.dto.BusLocationDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

@Slf4j
@Component("apsrtcTransitProvider")
public class APSRTCTransitProvider implements TransitProvider {

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BASE_URL = "https://rtc.avinash9.in";

    // Cache of 13,858 places
    private final List<Map<String, Object>> cachedPlaces = new CopyOnWriteArrayList<>();
    private volatile boolean placesLoaded = false;

    @Override
    public String getProviderName() {
        return "APSRTC_REALTIME";
    }

    @Override
    public boolean isAvailable() {
        return true;
    }

    /**
     * Search places from cached 13,858 places database with intelligent Bus Stand prioritization
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> searchPlaces(String query) {
        ensurePlacesLoaded();
        if (query == null || query.trim().isEmpty()) {
            // Default: return top primary bus stands and major transit hubs
            return cachedPlaces.stream()
                    .filter(p -> {
                        String name = String.valueOf(p.getOrDefault("placeName", ""));
                        String pid = String.valueOf(p.getOrDefault("placeId", ""));
                        String lpid = String.valueOf(p.getOrDefault("linkPlaceId", ""));
                        return pid.equals(lpid) && (name.contains("BS") || name.length() <= 12);
                    })
                    .limit(60)
                    .collect(Collectors.toList());
        }

        String q = query.trim().toLowerCase();

        return cachedPlaces.stream()
                .filter(p -> {
                    String name = String.valueOf(p.getOrDefault("placeName", "")).toLowerCase();
                    String district = String.valueOf(p.getOrDefault("district", "")).toLowerCase();
                    String mandal = String.valueOf(p.getOrDefault("mandalName", "")).toLowerCase();
                    return name.contains(q) || district.contains(q) || mandal.contains(q);
                })
                .map(p -> {
                    Map<String, Object> copy = new HashMap<>(p);
                    int score = calculateBusStandScore(p, q);
                    copy.put("_searchScore", score);

                    String name = String.valueOf(p.getOrDefault("placeName", ""));
                    String pid = String.valueOf(p.getOrDefault("placeId", ""));
                    String lpid = String.valueOf(p.getOrDefault("linkPlaceId", ""));

                    boolean isStand = pid.equals(lpid) || name.toUpperCase().matches(".*\\b(BS|BUS STAND|BUS STATION|RTC COMPLEX|DEPOT|TERMINAL)\\b.*");
                    copy.put("isBusStand", isStand);
                    if (name.toUpperCase().matches(".*\\b(BS|BUS STAND|BUS STATION)\\b.*")) {
                        copy.put("standBadge", "Bus Stand");
                    } else if (pid.equals(lpid)) {
                        copy.put("standBadge", "Main Hub");
                    }
                    return copy;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("_searchScore"), (Integer) a.get("_searchScore")))
                .limit(60)
                .collect(Collectors.toList());
    }

    private int calculateBusStandScore(Map<String, Object> p, String q) {
        int score = 0;
        String name = String.valueOf(p.getOrDefault("placeName", ""));
        String nameLower = name.toLowerCase();
        String pid = String.valueOf(p.getOrDefault("placeId", ""));
        String lpid = String.valueOf(p.getOrDefault("linkPlaceId", ""));

        // Exact name match
        if (nameLower.equals(q)) {
            score += 1000;
        } else if (nameLower.startsWith(q)) {
            score += 350;
        }

        // Primary transit hub (links to itself)
        if (pid.equals(lpid)) {
            score += 500;
        }

        // Explicit Bus Stand / Depot keywords
        String upper = name.toUpperCase();
        if (upper.matches(".*\\b(BS|BUS STAND|BUS STATION|RTC COMPLEX|DEPOT|TERMINAL)\\b.*")) {
            score += 400;
        }

        // Penalize railway or airport or flyover when searching for bus stands
        if (upper.matches(".*\\b(RAILWAY|AIRPORT|AIR PORT|FLYOVER)\\b.*")) {
            score -= 250;
        }

        // Penalize overly long sub-street descriptions to prioritize clean bus stations
        score -= (name.length() * 2);

        return score;
    }

    @SuppressWarnings("unchecked")
    private synchronized void ensurePlacesLoaded() {
        if (placesLoaded && !cachedPlaces.isEmpty()) return;
        try {
            log.info("Loading places database from local classpath resource: data/places.json");
            org.springframework.core.io.ClassPathResource resource = new org.springframework.core.io.ClassPathResource("data/places.json");
            if (resource.exists()) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> resp = mapper.readValue(resource.getInputStream(), Map.class);
                if (resp != null && resp.containsKey("miniServicePlaces")) {
                    List<Map<String, Object>> list = (List<Map<String, Object>>) resp.get("miniServicePlaces");
                    cachedPlaces.clear();
                    cachedPlaces.addAll(list);
                    placesLoaded = true;
                    log.info("Loaded {} places locally from classpath in <50ms", cachedPlaces.size());
                    return;
                }
            }
        } catch (Exception e) {
            log.warn("Could not read local data/places.json: {}", e.getMessage());
        }

        // Fallback to remote API only if local file is missing
        try {
            log.info("Fallback fetching places database from remote {}", BASE_URL + "/places");
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            Map<String, Object> resp = restTemplate.getForObject(BASE_URL + "/places", Map.class);
            if (resp != null && resp.containsKey("miniServicePlaces")) {
                List<Map<String, Object>> list = (List<Map<String, Object>>) resp.get("miniServicePlaces");
                cachedPlaces.clear();
                cachedPlaces.addAll(list);
                placesLoaded = true;
                log.info("Loaded {} places into cache from remote", cachedPlaces.size());
            }
        } catch (Exception e) {
            log.error("Failed to load places: {}", e.getMessage());
        }
    }

    /**
     * Fetch active bus services for user-selected origin and destination
     */
    public List<?> getServices(String sourcePlaceId, String destinationPlaceId, String sourceLinkId, String destinationLinkId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0");

            Map<String, String> body = new HashMap<>();
            body.put("sourcePlaceId", sourcePlaceId);
            body.put("destinationPlaceId", destinationPlaceId);
            body.put("sourceLinkId", sourceLinkId != null ? sourceLinkId : sourcePlaceId);
            body.put("destinationLinkId", destinationLinkId != null ? destinationLinkId : destinationPlaceId);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            Object[] services = restTemplate.postForObject(BASE_URL + "/services", request, Object[].class);
            return services != null ? Arrays.asList(services) : Collections.emptyList();
        } catch (Exception e) {
            log.error("Error fetching services: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Start/register tracking refresher for routeKey
     */
    public Map<?, ?> startTrackingBulk(String routeKey, int refreshIntervalMs) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "Mozilla/5.0");

            Map<String, Object> body = new HashMap<>();
            body.put("routeKey", routeKey);
            body.put("refreshIntervalMs", refreshIntervalMs > 0 ? refreshIntervalMs : 5000);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            return restTemplate.postForObject(BASE_URL + "/tracking/bulk", request, Map.class);
        } catch (Exception e) {
            log.error("Error starting bulk tracking: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }

    /**
     * Get real-time GPS locations of all live buses for a given routeKey
     */
    @SuppressWarnings("unchecked")
    public List<BusLocationDTO> getRealtimeBusesForRoute(String routeKey) {
        List<BusLocationDTO> list = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            Map<String, Object> resp = restTemplate.getForObject(BASE_URL + "/tracking/bulk/" + routeKey, Map.class);
            if (resp != null && resp.containsKey("buses") && resp.get("buses") instanceof Map) {
                Map<String, Object> busesMap = (Map<String, Object>) resp.get("buses");
                for (Map.Entry<String, Object> entry : busesMap.entrySet()) {
                    if (entry.getValue() instanceof Map) {
                        Map<String, Object> busObj = (Map<String, Object>) entry.getValue();
                        Map<String, Object> data = (Map<String, Object>) busObj.get("data");
                        if (data != null) {
                            double lat = parseDouble(data.get("latitude"));
                            double lng = parseDouble(data.get("longitude"));
                            double speed = parseDouble(data.get("speed"));
                            double bearing = parseDouble(data.get("locationBearing"));

                            String busNo = String.valueOf(data.getOrDefault("busNumber", data.getOrDefault("vehicleNumber", entry.getKey())));
                            String depot = String.valueOf(data.getOrDefault("depotName", ""));
                            String serviceType = String.valueOf(data.getOrDefault("serviceType", "EXPRESS"));
                            String oprsNo = String.valueOf(data.getOrDefault("oprsNo", ""));
                            String serviceDocId = String.valueOf(data.getOrDefault("serviceDocId", entry.getKey()));

                            list.add(BusLocationDTO.builder()
                                    .busNumber(busNo)
                                    .routeId(routeKey)
                                    .vehicleId(String.valueOf(data.getOrDefault("serviceId", "")))
                                    .sourceName(depot)
                                    .destinationName(serviceType)
                                    .routeName(depot + " • " + serviceType + (oprsNo.isEmpty() ? "" : " (" + oprsNo + ")"))
                                    .latitude(lat)
                                    .longitude(lng)
                                    .speedKmph(speed)
                                    .bearing(bearing)
                                    .direction(getHeadingDirection(bearing))
                                    .nextStop(depot)
                                    .status("Live")
                                    .lastUpdated("Just now")
                                    .isOnline(true)
                                    .timestamp(LocalDateTime.now())
                                    .build());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error fetching live tracking for {}: {}", routeKey, e.getMessage());
        }
        return list;
    }

    private double parseDouble(Object val) {
        if (val == null) return 0.0;
        try {
            return Double.parseDouble(String.valueOf(val));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private String getHeadingDirection(double degrees) {
        String[] directions = {"North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"};
        int idx = (int) Math.round(((degrees % 360) / 45)) % 8;
        return directions[idx >= 0 ? idx : 0];
    }

    @Override
    public List<BusLocationDTO> getActiveBuses() {
        return getRealtimeBusesForRoute("14701_4851");
    }

    @Override
    public BusLocationDTO getBusLocation(String busNumber) {
        return getActiveBuses().stream()
                .filter(b -> b.getBusNumber().equalsIgnoreCase(busNumber))
                .findFirst()
                .orElse(null);
    }

    @Override
    public List<double[]> getRoutePolyline(String serviceDocId) {
        List<double[]> points = new ArrayList<>();
        try {
            Map<?, ?> res = restTemplate.getForObject(BASE_URL + "/bus-routes/" + serviceDocId, Map.class);
            if (res != null && res.containsKey("polyline") && res.get("polyline") != null) {
                String polyStr = String.valueOf(res.get("polyline"));
                for (String part : polyStr.split("\\|")) {
                    String[] coords = part.split(",");
                    if (coords.length == 2) {
                        points.add(new double[]{Double.parseDouble(coords[0]), Double.parseDouble(coords[1])});
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Polyline error for {}: {}", serviceDocId, e.getMessage());
        }
        return points;
    }
}
