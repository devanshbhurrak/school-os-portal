import { apiClient } from "./api-client";
import type { ImportJob, ImportResourceType } from "@/types";

export async function listImportJobs(
  _schoolId: string,
  params: { resource_type?: ImportResourceType; status?: string; limit?: number } = {},
): Promise<ImportJob[]> {
  const { data } = await apiClient.get<ImportJob[]>("/import-jobs", { params });
  return data;
}

export async function getImportJob(_schoolId: string, id: string): Promise<ImportJob> {
  const { data } = await apiClient.get<ImportJob>(`/import-jobs/${id}`);
  return data;
}

export async function uploadImport(
  _schoolId: string,
  resourceType: ImportResourceType,
  file: File,
): Promise<ImportJob> {
  const formData = new FormData();
  formData.append("resource_type", resourceType);
  formData.append("file", file);
  // Do NOT set Content-Type manually — Axios sets multipart/form-data with the correct boundary.
  const { data } = await apiClient.post<ImportJob>("/import-jobs/upload", formData);
  return data;
}

export async function downloadTemplate(
  _schoolId: string,
  resourceType: ImportResourceType,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/imports/template/${resourceType}`, {
    responseType: "blob",
  });
  return data;
}

export async function downloadExport(
  _schoolId: string,
  resourceType: ImportResourceType,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/exports/${resourceType}`, {
    responseType: "blob",
  });
  return data;
}
