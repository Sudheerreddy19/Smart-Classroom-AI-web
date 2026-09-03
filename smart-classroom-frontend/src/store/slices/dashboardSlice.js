import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import dashboardApi from "../../api/dashboardApi";

export const fetchDashboardStats = createAsyncThunk("dashboard/fetchStats", async (_, { rejectWithValue }) => {
  try { const { data } = await dashboardApi.getStats(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch dashboard stats"); }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => { state.loading = true; })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => { state.loading = false; state.stats = action.payload; })
      .addCase(fetchDashboardStats.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const selectDashboard = (state) => state.dashboard;
export default dashboardSlice.reducer;
