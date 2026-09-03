import axiosClient from "./axiosClient";

const marksApi = {
  getAll: (params) =>
    axiosClient.get("/marks", { params }),

  getById: (id) =>
    axiosClient.get(`/marks/${id}`),

  getByStudent: (studentId) =>
    axiosClient.get(`/marks/student/${studentId}`),

  create: (data) =>
    axiosClient.post("/marks", data),

  update: (id, data) =>
    axiosClient.put(`/marks/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/marks/${id}`),

  bulkCreate: (data) =>
    axiosClient.post("/marks/bulk", data),
};

export default marksApi;
