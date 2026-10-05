import { apiClient } from "./api-client";
import type {
  CursorPage,
  Document,
  DocumentDownloadResponse,
  DocumentListParams,
  DocumentUploadRequest,
  DocumentUploadResponse,
} from "@/types";

export async function requestUpload(
  input: DocumentUploadRequest,
): Promise<DocumentUploadResponse> {
  const { data } = await apiClient.post<DocumentUploadResponse>(
    "/documents/upload-url",
    input,
  );
  return data;
}

export async function confirmUpload(documentId: string): Promise<Document> {
  const { data } = await apiClient.post<Document>(
    `/documents/${documentId}/confirm`,
  );
  return data;
}

export async function getDownloadUrl(
  documentId: string,
): Promise<DocumentDownloadResponse> {
  const { data } = await apiClient.get<DocumentDownloadResponse>(
    `/documents/${documentId}/download-url`,
  );
  return data;
}

export async function listDocuments(
  params: DocumentListParams = {},
): Promise<CursorPage<Document>> {
  const { data } = await apiClient.get<CursorPage<Document>>("/documents", {
    params,
  });
  return data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}

/**
 * Orchestrates a full document upload:
 * 1. Request a pre-signed upload URL
 * 2. PUT the file to the upload URL
 * 3. Confirm the upload
 */
export async function uploadDocument(
  input: DocumentUploadRequest,
  file: File,
): Promise<Document> {
  const { id, upload_url } = await requestUpload(input);

  await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": input.mime_type },
    body: file,
  });

  return confirmUpload(id);
}
