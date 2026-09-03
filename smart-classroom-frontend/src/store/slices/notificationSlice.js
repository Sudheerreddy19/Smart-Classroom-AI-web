import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationApi from "../../api/notificationApi";
import toast from "react-hot-toast";

export const fetchNotifications = createAsyncThunk("notifications/fetchAll", async (userId, { rejectWithValue }) => {
  try { const { data } = await notificationApi.getAll(userId ? { userId } : {}); return data; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed to fetch notifications"); }
});

export const fetchUnreadCount = createAsyncThunk("notifications/unreadCount", async (userId, { rejectWithValue }) => {
  try {
    const { data } = await notificationApi.getUnreadCount
      ? notificationApi.getUnreadCount(userId)
      : { data: 0 };
    return data;
  } catch { return 0; }
});

export const markAllRead = createAsyncThunk("notifications/markAllRead", async (userId, { rejectWithValue }) => {
  try { await notificationApi.markAllRead(userId); toast.success("All marked as read!"); return userId; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const markRead = createAsyncThunk("notifications/markRead", async (id, { rejectWithValue }) => {
  try { await notificationApi.markRead(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

export const deleteNotification = createAsyncThunk("notifications/delete", async (id, { rejectWithValue }) => {
  try { await notificationApi.delete(id); return id; }
  catch (err) { return rejectWithValue(err.response?.data?.message || "Failed"); }
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState: { list: [], unreadCount: 0, pagination: { totalElements: 0, totalPages: 0, number: 0 }, loading: false, error: null },
  reducers: {
    addNotification: (state, action) => { state.list.unshift(action.payload); state.unreadCount += 1; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.content) { state.list = action.payload.content; state.pagination = { totalElements: action.payload.totalElements, totalPages: action.payload.totalPages, number: action.payload.number }; }
        else { state.list = Array.isArray(action.payload) ? action.payload : []; }
        state.unreadCount = state.list.filter((n) => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => { state.unreadCount = action.payload; })
      .addCase(markAllRead.fulfilled, (state) => { state.list = state.list.map((n) => ({ ...n, read: true })); state.unreadCount = 0; })
      .addCase(markRead.fulfilled, (state, action) => {
        const i = state.list.findIndex((n) => n.id === action.payload);
        if (i !== -1) { state.list[i].read = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(deleteNotification.fulfilled, (state, action) => { state.list = state.list.filter((n) => n.id !== action.payload); });
  },
});

export const { addNotification } = notificationSlice.actions;
export const selectNotifications = (state) => state.notifications;
export default notificationSlice.reducer;
