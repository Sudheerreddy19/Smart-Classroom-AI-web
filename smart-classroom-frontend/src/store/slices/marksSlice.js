import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import marksApi from "../../api/marksApi";
import toast from "react-hot-toast";

export const fetchAllMarks = createAsyncThunk("marks/fetchAll", async (params, { rejectWithValue }) => {
  try { const { data } = await marksApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch marks"); }
});

export const fetchStudentMarks = createAsyncThunk("marks/fetchByStudent", async (studentId, { rejectWithValue }) => {
  try { const { data } = await marksApi.getByStudent(studentId); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const createMarks = createAsyncThunk("marks/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await marksApi.create(payload); toast.success("Marks added!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateMarks = createAsyncThunk("marks/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await marksApi.update(id, payload); toast.success("Marks updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteMarks = createAsyncThunk("marks/delete", async (id, { rejectWithValue }) => {
  try { await marksApi.delete(id); toast.success("Marks deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const marksSlice = createSlice({
  name: "marks",
  initialState: { list: [], studentMarks: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllMarks.pending, (state) => { state.loading = true; })
      .addCase(fetchAllMarks.fulfilled, (state, action) => { state.loading = false; state.list = Array.isArray(action.payload) ? action.payload : action.payload?.content || []; })
      .addCase(fetchAllMarks.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchStudentMarks.fulfilled, (state, action) => { state.studentMarks = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(createMarks.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateMarks.fulfilled, (state, action) => { const i = state.list.findIndex((m) => m.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteMarks.fulfilled, (state, action) => { state.list = state.list.filter((m) => m.id !== action.payload); });
  },
});

export const selectMarks = (state) => state.marks;
export default marksSlice.reducer;
