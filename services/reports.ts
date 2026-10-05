import { apiClient } from "./api-client";
import type { CursorPage } from "@/types/api";
import type { ExportJob } from "@/types/report";

export async function requestExport(payload: {
  report_type: string;
  filters?: Record<string, unknown>;
}): Promise<ExportJob> {
  const { data } = await apiClient.post<ExportJob>("/reports/export", payload);
  return data;
}

export async function listExportJobs(params?: {
  status?: string;
  cursor?: string;
  limit?: number;
}): Promise<CursorPage<ExportJob>> {
  const { data } = await apiClient.get<CursorPage<ExportJob>>("/reports/jobs", {
    params,
  });
  return data;
}

export async function getExportJob(jobId: string): Promise<ExportJob> {
  const { data } = await apiClient.get<ExportJob>(`/reports/jobs/${jobId}`);
  return data;
}

export async function downloadExport(jobId: string): Promise<Blob> {
  const { data } = await apiClient.get(`/reports/jobs/${jobId}/download`, {
    responseType: "blob",
  });
  return data;
}
