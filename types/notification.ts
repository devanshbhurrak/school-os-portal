export type NotificationType = "ANNOUNCEMENT" | "ATTENDANCE" | "ENROLLMENT" | "SYSTEM";

export interface Notification {
  id: string;
  user_id: string;
  school_id: string | null;
  organization_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}
