import { apiClient } from "./api-client";
import type { CursorPage } from "@/types/api";
import type { Notification, UnreadCountResponse } from "@/types/notification";

export async function listNotifications(params?: {
  is_read?: boolean;
  type?: string;
  cursor?: string;
  limit?: number;
}): Promise<CursorPage<Notification>> {
  const { data } = await apiClient.get<CursorPage<Notification>>("/notifications", { params });
  return data;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.post(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/read-all");
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await apiClient.get<UnreadCountResponse>("/notifications/unread-count");
  return data;
}
