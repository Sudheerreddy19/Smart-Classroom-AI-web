import axiosClient from "./axiosClient";

const semesterApi = {
  getAll: () =>
    axiosClient.get("/semesters"),

  getById: (id) =>
    axiosClient.get(`/semesters/${id}`),

  getByDepartment: (departmentId) =>
    axiosClient.get(`/semesters/department/${departmentId}`),

  create: (data) =>
    axiosClient.post("/semesters", data),

  update: (id, data) =>
    axiosClient.put(`/semesters/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/semesters/${id}`),
};

export default semesterApi;
