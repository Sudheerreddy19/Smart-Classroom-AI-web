import axiosClient from "./axiosClient";

const classroomApi = {
  getAll: (params) =>
    axiosClient.get("/classrooms", { params }),

  getById: (id) =>
    axiosClient.get(`/classrooms/${id}`),

  create: (data) =>
    axiosClient.post("/classrooms", data),

  update: (id, data) =>
    axiosClient.put(`/classrooms/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/classrooms/${id}`),
};

export default classroomApi;
