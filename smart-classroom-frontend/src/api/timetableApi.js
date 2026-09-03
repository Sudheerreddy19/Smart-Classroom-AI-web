import axiosClient from "./axiosClient";

const timetableApi = {
  getAll: (params) =>
    axiosClient.get("/timetables", { params }),

  getBySemester: (semesterId) =>
    axiosClient.get(`/timetables/semester/${semesterId}`),

  getByTeacher: (teacherId) =>
    axiosClient.get(`/timetables/teacher/${teacherId}`),

  getByClassroom: (classroomId) =>
    axiosClient.get(`/timetables/classroom/${classroomId}`),

  create: (data) =>
    axiosClient.post("/timetables", data),

  update: (id, data) =>
    axiosClient.put(`/timetables/${id}`, data),

  delete: (id) =>
    axiosClient.delete(`/timetables/${id}`),
};

export default timetableApi;
