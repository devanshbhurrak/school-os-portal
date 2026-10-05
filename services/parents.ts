import { apiClient } from "./api-client";
import type {
  CursorPage,
  Parent,
  ParentCreate,
  ParentListParams,
  ParentUpdate,
  StudentParentCreate,
  StudentParentLink,
} from "@/types";

export async function listParents(
  params: ParentListParams = {},
): Promise<CursorPage<Parent>> {
  const { data } = await apiClient.get<CursorPage<Parent>>("/parents", { params });
  return data;
}

export async function getParent(parentId: string): Promise<Parent> {
  const { data } = await apiClient.get<Parent>(`/parents/${parentId}`);
  return data;
}

export async function createParent(input: ParentCreate): Promise<Parent> {
  const { data } = await apiClient.post<Parent>("/parents", input);
  return data;
}

export async function updateParent(parentId: string, input: ParentUpdate): Promise<Parent> {
  const { data } = await apiClient.patch<Parent>(`/parents/${parentId}`, input);
  return data;
}

export async function deleteParent(parentId: string, version: number): Promise<void> {
  await apiClient.delete(`/parents/${parentId}`, { data: { version } });
}

export async function listChildren(parentId: string): Promise<StudentParentLink[]> {
  const { data } = await apiClient.get<StudentParentLink[]>(`/parents/${parentId}/children`);
  return data;
}

export async function listParentsForStudent(studentId: string): Promise<StudentParentLink[]> {
  const { data } = await apiClient.get<StudentParentLink[]>(`/students/${studentId}/parents`);
  return data;
}

export async function linkParentToStudent(
  studentId: string,
  input: StudentParentCreate,
): Promise<StudentParentLink> {
  const { data } = await apiClient.post<StudentParentLink>(
    `/students/${studentId}/parents`,
    input,
  );
  return data;
}

export async function unlinkParent(linkId: string): Promise<void> {
  await apiClient.delete(`/student-parents/${linkId}`);
}
