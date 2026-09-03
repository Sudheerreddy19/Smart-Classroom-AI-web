import axios from "axios";
import toast from "react-hot-toast";

/**
 * baseURL = "/api"
 * In dev: Vite proxy forwards /api/* → http://localhost:8080/api/*
 * In prod: set VITE_API_URL=https://your-domain.com in .env
 */
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

// ── Request: attach JWT ───────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: auto-refresh on 401 + global error toasts ──────────────────────
axiosClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;
    const status   = error.response?.status;
    const message  = error.response?.data?.message;

    // ── Auto-refresh token on 401 ─────────────────────────────────────────
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("no refresh token");

        const { data } = await axios.post(`/api/auth/refresh`, { refreshToken });

        localStorage.setItem("accessToken", data.accessToken);
        if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data));

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return axiosClient(original);
      } catch {
        // Refresh failed — force logout
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    // ── Global error toasts (only for non-auth errors) ─────────────────────
    // 400, 401, 404 — handled by individual pages/slices, no global toast
    // 403: access denied
    if (status === 403) {
      toast.error("Access denied. You don't have permission.");
    }
    // 409: duplicate
    else if (status === 409) {
      toast.error(message || "Duplicate entry — this record already exists.");
    }
    // 5xx: server error
    else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    // No response: network error
    else if (!error.response) {
      toast.error(
        "Cannot connect to the server. Make sure the backend is running on port 8080."
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
