import axiosClient from "./axiosClient";

const subjectApi = {
  getAll: (params) =>
    axiosClient.get("/subjects", { params }),

  getById: (id) =>
    axiosClient.get(`/subjects/${id}`),

  getByDepartment: (departmentId) =>
    axiosClient.get(`/subjects/department/${departmentId}`),

  create: (data) =>
    axiosClient.post("/subjects", data),

  update: (id, data) =>
    axiosClient.put(`/subjects/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/subjects/${id}`),
};

export default subjectApi;
