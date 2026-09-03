import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import departmentApi from "../../api/departmentApi";
import axios from "axios";
import toast from "react-hot-toast";

export const fetchDepartments = createAsyncThunk("departments/fetchAll", async (_, { rejectWithValue }) => {
  try { const { data } = await departmentApi.getAll(); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch departments"); }
});

// Public fetch — no JWT needed (used on Register page before login)
export const fetchDepartmentsPublic = createAsyncThunk("departments/fetchPublic", async (_, { rejectWithValue }) => {
  try {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    const { data } = await axios.get(`${baseUrl}/departments`);
    return data;
  } catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch departments"); }
});


export const createDepartment = createAsyncThunk("departments/create", async (payload, { rejectWithValue }) => {
  try { const { data } = await departmentApi.create(payload); toast.success("Department created!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const updateDepartment = createAsyncThunk("departments/update", async ({ id, data: payload }, { rejectWithValue }) => {
  try { const { data } = await departmentApi.update(id, payload); toast.success("Department updated!"); return data; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

export const deleteDepartment = createAsyncThunk("departments/delete", async (id, { rejectWithValue }) => {
  try { await departmentApi.delete(id); toast.success("Department deleted!"); return id; }
  catch (err) { const msg = err.response?.data?.message || "Failed"; toast.error(msg); return rejectWithValue(msg); }
});

const departmentSlice = createSlice({
  name: "departments",
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => { state.loading = true; })
      .addCase(fetchDepartments.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchDepartments.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchDepartmentsPublic.pending, (state) => { state.loading = true; })
      .addCase(fetchDepartmentsPublic.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchDepartmentsPublic.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(createDepartment.fulfilled, (state, action) => { state.list.unshift(action.payload); })
      .addCase(updateDepartment.fulfilled, (state, action) => { const i = state.list.findIndex((d) => d.id === action.payload.id); if (i !== -1) state.list[i] = action.payload; })
      .addCase(deleteDepartment.fulfilled, (state, action) => { state.list = state.list.filter((d) => d.id !== action.payload); });
  },
});

export const selectDepartments = (state) => state.departments;
export default departmentSlice.reducer;
