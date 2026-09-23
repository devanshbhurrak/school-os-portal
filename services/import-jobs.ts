import { apiClient } from "./api-client";
import type { ImportJob, ImportResourceType } from "@/types";

export async function listImportJobs(
  schoolId: string,
  params: { resource_type?: ImportResourceType; status?: string; limit?: number } = {},
): Promise<ImportJob[]> {
  const { data } = await apiClient.get<ImportJob[]>("/import-jobs", {
    headers: { "X-School-ID": schoolId },
    params,
  });
  return data;
}

export async function getImportJob(schoolId: string, id: string): Promise<ImportJob> {
  const { data } = await apiClient.get<ImportJob>(`/import-jobs/${id}`, {
    headers: { "X-School-ID": schoolId },
  });
  return data;
}

export async function uploadImport(
  schoolId: string,
  resourceType: ImportResourceType,
  file: File,
): Promise<ImportJob> {
  const formData = new FormData();
  formData.append("resource_type", resourceType);
  formData.append("file", file);
  const { data } = await apiClient.post<ImportJob>("/import-jobs/upload", formData, {
    headers: {
      "X-School-ID": schoolId,
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function downloadTemplate(
  schoolId: string,
  resourceType: ImportResourceType,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/imports/template/${resourceType}`, {
    headers: { "X-School-ID": schoolId },
    responseType: "blob",
  });
  return data;
}

export async function downloadExport(
  schoolId: string,
  resourceType: ImportResourceType,
): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/exports/${resourceType}`, {
    headers: { "X-School-ID": schoolId },
    responseType: "blob",
  });
  return data;
}
