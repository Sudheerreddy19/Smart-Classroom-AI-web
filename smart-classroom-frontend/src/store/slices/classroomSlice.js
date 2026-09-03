import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import classroomApi from "../../api/classroomApi";
import toast from "react-hot-toast";

export const fetchClassrooms = createAsyncThunk("classrooms/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await classroomApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch classrooms"); }
});

export const createClassroom = createAsyncThunk("classrooms/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await classroomApi.create(payload); toast.success("Classroom created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateClassroom = createAsyncThunk("classrooms/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await classroomApi.update(id, payload); toast.success("Classroom updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteClassroom = createAsyncThunk("classrooms/delete", async (id, { rejectWithValue }) => {
  try { await classroomApi.delete(id); toast.success("Classroom deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const classroomSlice = createSlice({
  name: "classrooms",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassrooms.pending, (state) => { state.loading = true; })
      .addCase(fetchClassrooms.fulfilled, (state, action) => { state.loading = false; state.list = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchClassrooms.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createClassroom.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateClassroom.fulfilled, (state, action) => { const i = state.list.findIndex((c) => c.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteClassroom.fulfilled, (state, action) => { state.list = state.list.filter((c) => c.id !== action.payload); });
  },
});

export const selectClassrooms = (state) => state.classrooms;
export default classroomSlice.reducer;
