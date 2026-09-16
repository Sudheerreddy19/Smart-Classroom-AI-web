import axiosClient from "./axiosClient";

const busTrackingApi = {
  searchPlaces: (query = "") =>
    axiosClient.get("/bus-tracking/places", { params: { query } }),

  getServices: (data) =>
    axiosClient.post("/bus-tracking/services", data),

  startTracking: (data) =>
    axiosClient.post("/bus-tracking/start-tracking", data),

  getLiveTracking: (routeKey) =>
    axiosClient.get(`/bus-tracking/live/${encodeURIComponent(routeKey)}`),

  getPolyline: (serviceDocId) =>
    axiosClient.get(`/bus-tracking/polyline/${encodeURIComponent(serviceDocId)}`),

  getActiveBuses: () =>
    axiosClient.get("/bus-tracking/buses"),

  getBusByNumber: (busNumber) =>
    axiosClient.get(`/bus-tracking/buses/${encodeURIComponent(busNumber)}`),
};

export default busTrackingApi;
