import axiosClient from "./axiosClient";

const environmentApi = {
  getLatest: (classroomId) =>
    axiosClient.get(`/environment/latest/${classroomId}`),

  getAll: () =>
    axiosClient.get("/environment/latest"),

  getHistory: (classroomId, hours) =>
    axiosClient.get(`/environment/history/${classroomId}`, { params: { hours } }),

  getDashboard: () =>
    axiosClient.get("/environment/dashboard"),
};

export default environmentApi;
