import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import attendanceApi from "../../api/attendanceApi";
import toast from "react-hot-toast";

export const fetchTodaySessions = createAsyncThunk("attendance/fetchToday", async (_, { rejectWithValue }) => {
  try { const { data } = await attendanceApi.getTodaySessions(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch sessions"); }
});

export const fetchSessionAttendance = createAsyncThunk("attendance/fetchSession", async (sessionId, { rejectWithValue }) => {
  try { const { data } = await attendanceApi.getSessionAttendance(sessionId); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch attendance"); }
});

export const createSession = createAsyncThunk("attendance/createSession", async (payload, { rejectWithValue }) => {
  try { const { data } = await attendanceApi.createSession(payload); toast.success("Session started!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed to create session"; toast.error(msg); return rejectWithValue(msg); }
});

export const closeSession = createAsyncThunk("attendance/closeSession", async (sessionId, { rejectWithValue }) => {
  try { const { data } = await attendanceApi.closeSession(sessionId); toast.success("Session closed!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const markAttendance = createAsyncThunk("attendance/mark", async (payload, { rejectWithValue }) => {
  try { const { data } = await attendanceApi.markAttendance(payload); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to mark attendance"); }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState: {
    sessions: [],
    currentSession: null,
    records: [],
    loading: false,
    markingLoading: false,
    error: null,
  },
  reducers: {
    setCurrentSession: (state, action) => { state.currentSession = action.payload; },
    clearRecords: (state) => { state.records = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodaySessions.pending, (state) => { state.loading = true; })
      .addCase(fetchTodaySessions.fulfilled, (state, action) => { state.loading = false; state.sessions = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchTodaySessions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchSessionAttendance.pending, (state) => { state.loading = true; })
      .addCase(fetchSessionAttendance.fulfilled, (state, action) => { state.loading = false; state.records = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchSessionAttendance.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSession.fulfilled, (state, action) => { state.sessions.unshift(action.payload); state.currentSession = action.payload; })
      .addCase(closeSession.fulfilled, (state, action) => {
        const i = state.sessions.findIndex((s) => s.id === action.payload.id);
        if (i !== -1) state.sessions[i] = action.payload;
        if (state.currentSession?.id === action.payload.id) state.currentSession = action.payload;
      })
      .addCase(markAttendance.pending, (state) => { state.markingLoading = true; })
      .addCase(markAttendance.fulfilled, (state, action) => {
        state.markingLoading = false;
        const i = state.records.findIndex((r) => r.studentId === action.payload.studentId);
        if (i !== -1) state.records[i] = action.payload;
        else state.records.push(action.payload);
      })
      .addCase(markAttendance.rejected, (state) => { state.markingLoading = false; });
  },
});

export const { setCurrentSession, clearRecords } = attendanceSlice.actions;
export const selectAttendance = (state) => state.attendance;
export default attendanceSlice.reducer;
