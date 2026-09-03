import axiosClient from "./axiosClient";

const departmentApi = {
  getAll: () =>
    axiosClient.get("/departments"),

  getById: (id) =>
    axiosClient.get(`/departments/${id}`),

  create: (data) =>
    axiosClient.post("/departments", data),

  update: (id, data) =>
    axiosClient.put(`/departments/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/departments/${id}`),
};

export default departmentApi;
