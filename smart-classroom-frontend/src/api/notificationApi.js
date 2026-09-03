import axiosClient from "./axiosClient";

const notificationApi = {
  // GET all notifications for a user (paginated)
  getAll: (userId) =>
    axiosClient.get(`/notifications/user/${userId}`),

  // GET unread count
  getUnreadCount: (userId) =>
    axiosClient.get(`/notifications/user/${userId}/unread-count`),

  // PUT mark all as read for a user
  markAllRead: (userId) =>
    axiosClient.put(`/notifications/user/${userId}/read`),

  // PUT mark single as read (optimistic — not a backend endpoint, use markAllRead)
  markRead: (id) =>
    axiosClient.put(`/notifications/user/${id}/read`),

  // POST create notification
  create: (data) =>
    axiosClient.post("/notifications", data),

  // DELETE — if backend supports it; otherwise silently ignore
  delete: (id) =>
    axiosClient.delete(`/notifications/${id}`).catch(() => {}),
};

export default notificationApi;
