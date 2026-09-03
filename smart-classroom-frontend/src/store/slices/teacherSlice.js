import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import teacherApi from "../../api/teacherApi";
import toast from "react-hot-toast";

export const fetchTeachers = createAsyncThunk("teachers/fetchAll", async (params, { rejectWithValue }) => {
  try { const { data } = await teacherApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch teachers"); }
});

export const fetchTeacherById = createAsyncThunk("teachers/fetchById", async (id, { rejectWithValue }) => {
  try { const { data } = await teacherApi.getById(id); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Teacher not found"); }
});

export const createTeacher = createAsyncThunk("teachers/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await teacherApi.create(payload); toast.success("Teacher created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed to create teacher"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateTeacher = createAsyncThunk("teachers/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await teacherApi.update(id, payload); toast.success("Teacher updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed to update teacher"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteTeacher = createAsyncThunk("teachers/delete", async (id, { rejectWithValue }) => {
  try { await teacherApi.delete(id); toast.success("Teacher deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed to delete teacher"; toast.error(msg); return rejectWithValue(msg); }
});

const teacherSlice = createSlice({
  name: "teachers",
  initialState: { list: [], selectedTeacher: null, pagination: { totalElements: 0, totalPages: 0, number: 0, size: 10 }, loading: false, error: null },
  reducers: {
    clearSelectedTeacher: (state) => { state.selectedTeacher = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeachers.pending, (state) => { state.loading = true; })
      .addCase(fetchTeachers.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.content) { state.list = action.payload.content; state.pagination = { totalElements: action.payload.totalElements, totalPages: action.payload.totalPages, number: action.payload.number, size: action.payload.size }; }
        else { state.list = Array.isArray(action.payload) ? action.payload : []; }
      })
      .addCase(fetchTeachers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchTeacherById.fulfilled, (state, action) => { state.selectedTeacher = action.payload; })
      .addCase(createTeacher.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateTeacher.fulfilled, (state, action) => {
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(deleteTeacher.fulfilled, (state, action) => { state.list = state.list.filter((t) => t.id !== action.payload); });
  },
});

export const { clearSelectedTeacher } = teacherSlice.actions;
export const selectTeachers = (state) => state.teachers;
export default teacherSlice.reducer;
