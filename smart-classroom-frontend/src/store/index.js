import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import studentReducer from "./slices/studentSlice";
import teacherReducer from "./slices/teacherSlice";
import departmentReducer from "./slices/departmentSlice";
import semesterReducer from "./slices/semesterSlice";
import subjectReducer from "./slices/subjectSlice";
import classroomReducer from "./slices/classroomSlice";
import deviceReducer from "./slices/deviceSlice";
import attendanceReducer from "./slices/attendanceSlice";
import notificationReducer from "./slices/notificationSlice";
import marksReducer from "./slices/marksSlice";
import timetableReducer from "./slices/timetableSlice";
import dashboardReducer from "./slices/dashboardSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    teachers: teacherReducer,
    departments: departmentReducer,
    semesters: semesterReducer,
    subjects: subjectReducer,
    classrooms: classroomReducer,
    devices: deviceReducer,
    attendance: attendanceReducer,
    notifications: notificationReducer,
    marks: marksReducer,
    timetable: timetableReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});
