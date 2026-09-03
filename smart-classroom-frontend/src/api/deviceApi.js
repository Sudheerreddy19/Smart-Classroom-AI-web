import axiosClient from "./axiosClient";

const deviceApi = {
  getAll: (params) =>
    axiosClient.get("/devices", { params }),

  getById: (id) =>
    axiosClient.get(`/devices/${id}`),

  getByClassroom: (classroomId) =>
    axiosClient.get(`/devices/classroom/${classroomId}`),

  create: (data) =>
    axiosClient.post("/devices", data),

  update: (id, data) =>
    axiosClient.put(`/devices/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/devices/${id}`),

  toggle: (id, command) =>
    axiosClient.post(`/devices/${id}/command`, { command }),

  getStatus: () =>
    axiosClient.get("/devices/status"),
};

export default deviceApi;
