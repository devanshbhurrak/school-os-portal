"use client";

import { useRouter } from "next/navigation";

/** Deep-link target for a notification's related entity. */
export function notificationHref(n: {
  type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}): string {
  const entityType = (n.related_entity_type ?? "").toLowerCase();
  const id = n.related_entity_id;
  if (entityType === "announcement" && id) return `/announcements/${id}`;
  if (entityType === "attendance_session" && id) return `/attendance?session=${id}`;
  if ((entityType === "student" || entityType === "enrollment") && id)
    return `/students/${id}`;
  if (entityType === "teacher" && id) return `/teachers/${id}`;
  return "/notifications";
}

/** Navigate to the related entity (used by bell + list page). */
export function useNotificationNavigation() {
  const router = useRouter();
  return (n: {
    type: string;
    related_entity_type: string | null;
    related_entity_id: string | null;
  }) => router.push(notificationHref(n));
}
