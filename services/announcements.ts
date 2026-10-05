import { apiClient } from "./api-client";
import type { CursorPage } from "@/types";
import type {
  Announcement,
  AnnouncementCreate,
  AnnouncementFeedItem,
  AnnouncementListParams,
  AnnouncementPublish,
  AnnouncementUpdate,
} from "@/types/announcement";

export async function listAnnouncements(
  params: AnnouncementListParams = {},
): Promise<CursorPage<Announcement>> {
  const { data } = await apiClient.get<CursorPage<Announcement>>("/announcements", { params });
  return data;
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  const { data } = await apiClient.get<Announcement>(`/announcements/${id}`);
  return data;
}

export async function createAnnouncement(input: AnnouncementCreate): Promise<Announcement> {
  const { data } = await apiClient.post<Announcement>("/announcements", input);
  return data;
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementUpdate,
): Promise<Announcement> {
  const { data } = await apiClient.patch<Announcement>(`/announcements/${id}`, input);
  return data;
}

export async function publishAnnouncement(
  id: string,
  input: AnnouncementPublish,
): Promise<Announcement> {
  const { data } = await apiClient.post<Announcement>(`/announcements/${id}/publish`, input);
  return data;
}

export async function archiveAnnouncement(
  id: string,
  version: number,
): Promise<Announcement> {
  const { data } = await apiClient.post<Announcement>(`/announcements/${id}/archive`, { version });
  return data;
}

export async function deleteAnnouncement(id: string, version: number): Promise<void> {
  await apiClient.delete(`/announcements/${id}`, { data: { version } });
}

export async function getAnnouncementFeed(
  params: AnnouncementListParams = {},
): Promise<CursorPage<AnnouncementFeedItem>> {
  const { data } = await apiClient.get<CursorPage<AnnouncementFeedItem>>("/announcements/feed", { params });
  return data;
}
