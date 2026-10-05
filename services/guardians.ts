import { apiClient } from "./api-client";
import type { Guardian, GuardianCreate, GuardianUpdate } from "@/types";

export async function listGuardians(studentId: string): Promise<Guardian[]> {
  const { data } = await apiClient.get<Guardian[]>(`/students/${studentId}/guardians`);
  return data;
}

export async function getGuardian(id: string): Promise<Guardian> {
  const { data } = await apiClient.get<Guardian>(`/student-guardians/${id}`);
  return data;
}

export async function addGuardian(input: GuardianCreate): Promise<Guardian> {
  const { data } = await apiClient.post<Guardian>("/student-guardians", input);
  return data;
}

export async function updateGuardian(
  id: string,
  input: GuardianUpdate,
): Promise<Guardian> {
  const { data } = await apiClient.patch<Guardian>(`/student-guardians/${id}`, input);
  return data;
}

export async function removeGuardian(id: string): Promise<void> {
  await apiClient.delete(`/student-guardians/${id}`);
}
