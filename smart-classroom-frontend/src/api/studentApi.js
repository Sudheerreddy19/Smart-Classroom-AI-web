import axiosClient from "./axiosClient";

const studentApi = {
  getAll: (params) =>
    axiosClient.get("/students", { params }),

  getById: (id) =>
    axiosClient.get(`/students/${id}`),

  getByRoll: (rollNumber) =>
    axiosClient.get(`/students/roll/${rollNumber}`),

  getByDepartmentAndSemester: (departmentId, semesterId) =>
    axiosClient.get(`/students/department/${departmentId}/semester/${semesterId}`),

  create: (data) =>
    axiosClient.post("/students", data),

  update: (id, data) =>
    axiosClient.put(`/students/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/students/${id}`),

  uploadPhoto: (id, formData) =>
    axiosClient.post(`/students/${id}/photo`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default studentApi;
