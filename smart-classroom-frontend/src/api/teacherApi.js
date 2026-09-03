import axiosClient from "./axiosClient";

const teacherApi = {
  getAll: (params) =>
    axiosClient.get("/teachers", { params }),

  getById: (id) =>
    axiosClient.get(`/teachers/${id}`),

  getByDepartment: (departmentId) =>
    axiosClient.get(`/teachers/department/${departmentId}`),

  create: (data) =>
    axiosClient.post("/teachers", data),

  update: (id, data) =>
    axiosClient.put(`/teachers/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/teachers/${id}`),
};

export default teacherApi;
