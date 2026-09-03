import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../api/authApi";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

// ── Helper: check if a JWT token is still valid ───────────────────────────────
function isTokenValid(token) {
  if (!token) return false;
  try {
    const { exp } = jwtDecode(token);
    // Subtract 60s buffer so we refresh before it actually expires
    return exp * 1000 > Date.now() + 60000;
  } catch {
    return false;
  }
}

// ── Restore from localStorage on app load ────────────────────────────────────
// Only restore if the stored token is still valid
const storedToken = localStorage.getItem("accessToken");
const storedUser  = (() => {
  if (!isTokenValid(storedToken)) {
    // Token expired or invalid — clear storage and force re-login
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    return null;
  }
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

// ── Thunks ────────────────────────────────────────────────────────────────────

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authApi.login(credentials);
      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user",         JSON.stringify(data));
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 401
          ? "Invalid email or password."
          : err.response?.status === 400
          ? "Please check your email and password."
          : "Login failed. Make sure the server is running.");
      return rejectWithValue(msg);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authApi.register(userData);
      localStorage.setItem("accessToken",  data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("user",         JSON.stringify(data));
      return data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? "Email is already registered. Try signing in instead."
          : err.response?.status === 400
          ? "Registration blocked: only student accounts can be self-registered."
          : "Registration failed. Please try again.");
      return rejectWithValue(msg);
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) await authApi.logout(refreshToken);
  } catch {
    /* ignore — clear state regardless */
  } finally {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
});

// ── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user:         storedUser,
    accessToken:  storedUser ? storedToken : null,  // null if token expired
    loading:      false,
    error:        null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setUser:    (state, action) => { state.user = action.payload; },
    forceLogout: (state) => {
      state.user        = null;
      state.accessToken = null;
      state.error       = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    // ── Login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading     = false;
        state.user        = action.payload;
        state.accessToken = action.payload.accessToken;
        state.error       = null;
        toast.success(`Welcome back, ${action.payload.firstName}! 👋`);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        // Toast is also shown by axiosClient for server errors,
        // but for 401/400 we show it here since those are silent in axiosClient
        toast.error(action.payload);
      });

    // ── Register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading     = false;
        state.user        = action.payload;
        state.accessToken = action.payload.accessToken;
        state.error       = null;
        toast.success(`Account created! Welcome, ${action.payload.firstName}! 🎉`);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
        // Shown inline in Register page — no extra toast needed
      });

    // ── Logout ──
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user        = null;
        state.accessToken = null;
        state.error       = null;
      });
  },
});

export const { clearError, setUser, forceLogout } = authSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectAuth            = (state) => state.auth;
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.accessToken;

export default authSlice.reducer;
