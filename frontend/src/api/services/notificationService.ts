import api from "../axios";
import type {
  Notification,
  NotificationListResponse,
  NotificationUnreadCountResponse,
} from "../../types/notification";

const notificationService = {
  async getAll(): Promise<Notification[] | NotificationListResponse> {
    const response = await api.get<
      Notification[] | NotificationListResponse
    >("/notifications/");

    return response.data;
  },

  async getUnreadCount(): Promise<number> {
    const response =
      await api.get<NotificationUnreadCountResponse>(
        "/notifications/unread-count/",
      );

    return response.data.count;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await api.post<Notification>(
      `/notifications/${id}/mark-read/`,
    );

    return response.data;
  },

  async markAllAsRead(): Promise<{ modifiees: number }> {
    const response = await api.post<{ modifiees: number }>(
      "/notifications/mark-all-read/",
    );

    return response.data;
  },
};

export default notificationService;

