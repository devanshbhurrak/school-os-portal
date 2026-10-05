export type DocumentStatus = "PENDING_UPLOAD" | "CONFIRMED" | "DELETED";
export type DocumentEntityType = "STUDENT" | "TEACHER" | "PARENT" | "SCHOOL";
export type DocumentType = "PHOTO" | "ID_PROOF" | "BIRTH_CERTIFICATE" | "CERTIFICATE" | "TRANSCRIPT" | "REPORT_CARD" | "OTHER";

export interface Document {
  id: string;
  school_id: string;
  organization_id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  document_type: DocumentType;
  original_filename: string;
  mime_type: string | null;
  file_size: number | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  created_by_id: string | null;
}

export interface DocumentUploadRequest {
  entity_type: DocumentEntityType;
  entity_id: string;
  document_type: DocumentType;
  original_filename: string;
  mime_type: string;
  file_size: number;
}

export interface DocumentUploadResponse {
  id: string;
  upload_url: string;
  storage_key: string;
}

export interface DocumentDownloadResponse {
  download_url: string;
  filename: string;
}

export interface DocumentListParams {
  entity_type?: DocumentEntityType;
  entity_id?: string;
  document_type?: DocumentType;
  cursor?: string;
  limit?: number;
}
