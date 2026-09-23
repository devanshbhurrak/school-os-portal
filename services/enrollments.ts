import { apiClient } from "./api-client";
import type { CursorPage } from "@/types";
import type { Enrollment, EnrollmentCreate, EnrollmentUpdate, EnrollmentTransfer } from "@/types/student";

export interface EnrollmentListParams {
  student_id?: string;
  academic_year_id?: string;
  cohort_id?: string;
  status?: string;
  limit?: number;
  cursor?: string;
}

export async function listEnrollments(
  params: EnrollmentListParams = {},
): Promise<CursorPage<Enrollment>> {
  const { data } = await apiClient.get<CursorPage<Enrollment>>("/enrollments", { params });
  return data;
}

export async function getEnrollment(id: string): Promise<Enrollment> {
  const { data } = await apiClient.get<Enrollment>(`/enrollments/${id}`);
  return data;
}

export async function createEnrollment(input: EnrollmentCreate): Promise<Enrollment> {
  const { data } = await apiClient.post<Enrollment>("/enrollments", input);
  return data;
}

export async function updateEnrollment(id: string, input: EnrollmentUpdate): Promise<Enrollment> {
  const { data } = await apiClient.patch<Enrollment>(`/enrollments/${id}`, input);
  return data;
}

export async function deleteEnrollment(id: string, version: number): Promise<void> {
  await apiClient.delete(`/enrollments/${id}`, { data: { version } });
}

export async function transferEnrollment(id: string, input: EnrollmentTransfer): Promise<Enrollment> {
  const { data } = await apiClient.post<Enrollment>(`/enrollments/${id}/transfer`, input);
  return data;
}
