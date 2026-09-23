import type { ID, ISODateTime } from "./api";

export type AnnouncementPriority = "NORMAL" | "HIGH" | "URGENT";
export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "EXPIRED" | "ARCHIVED";
export type AnnouncementPublishMode = "IMMEDIATE" | "SCHEDULED";
export type AnnouncementTargetType = "SCHOOL" | "CLASS" | "COHORT" | "ROLE";

export interface AnnouncementTarget {
  id: ID;
  target_type: AnnouncementTargetType;
  target_id: ID | null;
}

export interface AnnouncementTargetCreate {
  target_type: AnnouncementTargetType;
  target_id?: ID;
}

export interface Announcement {
  id: ID;
  school_id: ID;
  organization_id: ID;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  publish_mode: AnnouncementPublishMode;
  published_at: ISODateTime | null;
  expires_at: ISODateTime | null;
  status: AnnouncementStatus;
  targets: AnnouncementTarget[];
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AnnouncementCreate {
  title: string;
  body: string;
  priority?: AnnouncementPriority;
  publish_mode?: AnnouncementPublishMode;
  targets?: AnnouncementTargetCreate[];
  expires_at?: ISODateTime;
}

export interface AnnouncementUpdate {
  title?: string;
  body?: string;
  priority?: AnnouncementPriority;
  targets?: AnnouncementTargetCreate[];
  expires_at?: ISODateTime | null;
  version: number;
}

export interface AnnouncementPublish {
  published_at?: ISODateTime;
  version: number;
}

export interface AnnouncementListParams {
  status?: AnnouncementStatus;
  priority?: AnnouncementPriority;
  limit?: number;
  cursor?: string;
}
