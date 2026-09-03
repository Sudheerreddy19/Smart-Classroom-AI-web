import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import semesterApi from "../../api/semesterApi";
import toast from "react-hot-toast";

export const fetchSemesters = createAsyncThunk("semesters/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await semesterApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch semesters"); }
});

export const createSemester = createAsyncThunk("semesters/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await semesterApi.create(payload); toast.success("Semester created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateSemester = createAsyncThunk("semesters/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await semesterApi.update(id, payload); toast.success("Semester updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteSemester = createAsyncThunk("semesters/delete", async (id, { rejectWithValue }) => {
  try { await semesterApi.delete(id); toast.success("Semester deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const semesterSlice = createSlice({
  name: "semesters",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSemesters.pending, (state) => { state.loading = true; })
      .addCase(fetchSemesters.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchSemesters.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSemester.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateSemester.fulfilled, (state, action) => { const i = state.list.findIndex((s) => s.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteSemester.fulfilled, (state, action) => { state.list = state.list.filter((s) => s.id !== action.payload); });
  },
});

export const selectSemesters = (state) => state.semesters;
export default semesterSlice.reducer;
