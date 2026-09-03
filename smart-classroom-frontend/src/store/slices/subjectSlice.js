import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import subjectApi from "../../api/subjectApi";
import toast from "react-hot-toast";

export const fetchSubjects = createAsyncThunk("subjects/fetchAll", async (params, { rejectWithValue }) => {
  try { const { data } = await subjectApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch subjects"); }
});

export const createSubject = createAsyncThunk("subjects/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await subjectApi.create(payload); toast.success("Subject created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateSubject = createAsyncThunk("subjects/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await subjectApi.update(id, payload); toast.success("Subject updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteSubject = createAsyncThunk("subjects/delete", async (id, { rejectWithValue }) => {
  try { await subjectApi.delete(id); toast.success("Subject deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const subjectSlice = createSlice({
  name: "subjects",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubjects.pending, (state) => { state.loading = true; })
      .addCase(fetchSubjects.fulfilled, (state, action) => { state.loading = false; state.list = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchSubjects.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createSubject.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateSubject.fulfilled, (state, action) => { const i = state.list.findIndex((s) => s.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteSubject.fulfilled, (state, action) => { state.list = state.list.filter((s) => s.id !== action.payload); });
  },
});

export const selectSubjects = (state) => state.subjects;
export default subjectSlice.reducer;
