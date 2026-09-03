import axiosClient from "./axiosClient";

// baseURL = /api, so paths here are relative to /api
const authApi = {
  login:  (credentials) => axiosClient.post("/auth/login",    credentials),
  register: (data)      => axiosClient.post("/auth/register", data),

  // Backend expects: POST /api/auth/refresh  body: { refreshToken }
  refreshToken: (refreshToken) =>
    axiosClient.post("/auth/refresh", { refreshToken }),

  // Backend expects: POST /api/auth/logout?refreshToken=...
  logout: (refreshToken) =>
    axiosClient.post(`/auth/logout?refreshToken=${encodeURIComponent(refreshToken)}`),

  forgotPassword: (email) =>
    axiosClient.post("/auth/forgot-password", { email }),
};

export default authApi;
