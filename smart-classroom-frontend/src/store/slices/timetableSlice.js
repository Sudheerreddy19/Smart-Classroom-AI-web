import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import timetableApi from "../../api/timetableApi";
import toast from "react-hot-toast";

export const fetchTimetables = createAsyncThunk("timetable/fetchAll", async (params, { rejectWithValue }) => {
  try { const { data } = await timetableApi.getAll(params); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch timetable"); }
});

export const createTimetable = createAsyncThunk("timetable/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await timetableApi.create(payload); toast.success("Timetable entry created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateTimetable = createAsyncThunk("timetable/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await timetableApi.update(id, payload); toast.success("Timetable updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteTimetable = createAsyncThunk("timetable/delete", async (id, { rejectWithValue }) => {
  try { await timetableApi.delete(id); toast.success("Timetable entry deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const timetableSlice = createSlice({
  name: "timetable",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimetables.pending, (state) => { state.loading = true; })
      .addCase(fetchTimetables.fulfilled, (state, action) => { state.loading = false; state.list = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchTimetables.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createTimetable.fulfilled, (state, action) => { state.list.push(action.payload); })
      .addCase(updateTimetable.fulfilled, (state, action) => { const i = state.list.findIndex((t) => t.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteTimetable.fulfilled, (state, action) => { state.list = state.list.filter((t) => t.id !== action.payload); });
  },
});

export const selectTimetable = (state) => state.timetable;
export default timetableSlice.reducer;
