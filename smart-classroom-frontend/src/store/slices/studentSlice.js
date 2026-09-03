import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import studentApi from "../../api/studentApi";
import toast from "react-hot-toast";

export const fetchStudents = createAsyncThunk(
  "students/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.getAll(params);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch students");
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  "students/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.getById(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Student not found");
    }
  }
);

export const createStudent = createAsyncThunk(
  "students/create",
  async (studentData, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.create(studentData);
      toast.success("Student created successfully!");
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create student";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateStudent = createAsyncThunk(
  "students/update",
  async ({ id, data: studentData }, { rejectWithValue }) => {
    try {
      const { data } = await studentApi.update(id, studentData);
      toast.success("Student updated successfully!");
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update student";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteStudent = createAsyncThunk(
  "students/delete",
  async (id, { rejectWithValue }) => {
    try {
      await studentApi.delete(id);
      toast.success("Student deleted successfully!");
      return id;
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete student";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const studentSlice = createSlice({
  name: "students",
  initialState: {
    list: [],
    selectedStudent: null,
    pagination: { totalElements: 0, totalPages: 0, number: 0, size: 10 },
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedStudent: (state) => { state.selectedStudent = null; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => { state.loading = true; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both paginated and list responses
        if (action.payload.content) {
          state.list = action.payload.content;
          state.pagination = {
            totalElements: action.payload.totalElements,
            totalPages: action.payload.totalPages,
            number: action.payload.number,
            size: action.payload.size,
          };
        } else {
          state.list = Array.isArray(action.payload) ? action.payload : [];
        }
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.selectedStudent = action.payload;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.pagination.totalElements += 1;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedStudent?.id === action.payload.id) state.selectedStudent = action.payload;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
        state.pagination.totalElements -= 1;
      });
  },
});

export const { clearSelectedStudent, clearError } = studentSlice.actions;
export const selectStudents = (state) => state.students;
export default studentSlice.reducer;
