import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import deviceApi from "../../api/deviceApi";
import toast from "react-hot-toast";

export const fetchDevices = createAsyncThunk("devices/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await deviceApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch devices"); }
});

export const createDevice = createAsyncThunk("devices/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await deviceApi.create(payload); toast.success("Device registered!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateDevice = createAsyncThunk("devices/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await deviceApi.update(id, payload); toast.success("Device updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteDevice = createAsyncThunk("devices/delete", async (id, { rejectWithValue }) => {
  try { await deviceApi.delete(id); toast.success("Device deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const controlDevice = createAsyncThunk("devices/control", async ({ deviceId, action }, { rejectWithValue }) => {
  try { await deviceApi.toggle(deviceId, action); toast.success(`Device ${action} sent!`); return { deviceId, action }; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const deviceSlice = createSlice({
  name: "devices",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => { state.loading = true; })
      .addCase(fetchDevices.fulfilled, (state, action) => { state.loading = false; state.list = Array.isArray(action.payload) ? action.payload : []; })
      .addCase(fetchDevices.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createDevice.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateDevice.fulfilled, (state, action) => { const i = state.list.findIndex((d) => d.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteDevice.fulfilled, (state, action) => { state.list = state.list.filter((d) => d.id !== action.payload); });
  },
});

export const selectDevices = (state) => state.devices;
export default deviceSlice.reducer;
