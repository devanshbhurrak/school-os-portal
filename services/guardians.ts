import { apiClient } from "./api-client";
import type { Guardian, GuardianCreate, GuardianUpdate } from "@/types";

export async function listGuardians(schoolId: string, studentId: string): Promise<Guardian[]> {
  const { data } = await apiClient.get<Guardian[]>(`/students/${studentId}/guardians`, {
    headers: { "X-School-ID": schoolId },
  });
  return data;
}

export async function getGuardian(schoolId: string, id: string): Promise<Guardian> {
  const { data } = await apiClient.get<Guardian>(`/student-guardians/${id}`, {
    headers: { "X-School-ID": schoolId },
  });
  return data;
}

export async function addGuardian(schoolId: string, data: GuardianCreate): Promise<Guardian> {
  const { data: result } = await apiClient.post<Guardian>("/student-guardians", data, {
    headers: { "X-School-ID": schoolId },
  });
  return result;
}

export async function updateGuardian(
  schoolId: string,
  id: string,
  data: GuardianUpdate,
): Promise<Guardian> {
  const { data: result } = await apiClient.patch<Guardian>(`/student-guardians/${id}`, data, {
    headers: { "X-School-ID": schoolId },
  });
  return result;
}

export async function removeGuardian(schoolId: string, id: string): Promise<void> {
  await apiClient.delete(`/student-guardians/${id}`, {
    headers: { "X-School-ID": schoolId },
  });
}
