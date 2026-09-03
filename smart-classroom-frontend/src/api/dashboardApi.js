import axiosClient from "./axiosClient";

const dashboardApi = {
  getStats: () =>
    axiosClient.get("/dashboard/stats"),

  getRecentAlerts: () =>
    axiosClient.get("/dashboard/alerts"),

  getAttendanceTrend: () =>
    axiosClient.get("/dashboard/attendance-trend"),

  getDeviceStatus: () =>
    axiosClient.get("/dashboard/device-status"),

  getEnvironmentSummary: () =>
    axiosClient.get("/dashboard/environment"),
};

export default dashboardApi;
