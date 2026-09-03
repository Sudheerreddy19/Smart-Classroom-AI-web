import axiosClient from "./axiosClient";

const attendanceApi = {
  // Sessions
  createSession: (data) =>
    axiosClient.post("/attendance/session", data),

  closeSession: (sessionId) =>
    axiosClient.put(`/attendance/session/${sessionId}/close`),

  getTodaySessions: () =>
    axiosClient.get("/attendance/today"),

  getSessionAttendance: (sessionId) =>
    axiosClient.get(`/attendance/session/${sessionId}`),

  // Marking
  markAttendance: (data) =>
    axiosClient.post("/attendance/mark", data),

  // Reports
  getStudentAttendance: (studentId, params) =>
    axiosClient.get(`/attendance/student/${studentId}`, { params }),

  getDailyReport: (date, classroomId) =>
    axiosClient.get("/attendance/report/daily", { params: { date, classroomId } }),

  getMonthlyReport: (month, year, departmentId) =>
    axiosClient.get("/attendance/report/monthly", { params: { month, year, departmentId } }),
};

export default attendanceApi;
