import { apiClient } from "./api-client";
import type {
  CursorPage,
  CursorParams,
  Teacher,
  TeacherAssignment,
  TeacherAssignmentCreate,
  TeacherAssignmentUpdate,
  TeacherCreate,
  TeacherStatus,
  TeacherUpdate,
} from "@/types";

export interface TeacherListParams extends CursorParams {
  search?: string;
  status?: TeacherStatus;
}

export interface AssignmentListParams extends CursorParams {
  teacher_id?: string;
  cohort_id?: string;
  academic_year_id?: string;
  status?: string;
}

export async function listTeachers(
  params: TeacherListParams = {},
): Promise<CursorPage<Teacher>> {
  const { data } = await apiClient.get<CursorPage<Teacher>>("/teachers", { params });
  return data;
}

export async function getTeacher(teacherId: string): Promise<Teacher> {
  const { data } = await apiClient.get<Teacher>(`/teachers/${teacherId}`);
  return data;
}

export async function createTeacher(input: TeacherCreate): Promise<Teacher> {
  const { data } = await apiClient.post<Teacher>("/teachers", input);
  return data;
}

export async function updateTeacher(
  teacherId: string,
  input: TeacherUpdate,
): Promise<Teacher> {
  const { data } = await apiClient.patch<Teacher>(`/teachers/${teacherId}`, input);
  return data;
}

export async function deleteTeacher(teacherId: string, version: number): Promise<void> {
  await apiClient.delete(`/teachers/${teacherId}`, { data: { version } });
}

export async function listAssignments(
  params: AssignmentListParams = {},
): Promise<CursorPage<TeacherAssignment>> {
  const { data } = await apiClient.get<CursorPage<TeacherAssignment>>("/teacher-assignments", { params });
  return data;
}

export async function getAssignment(assignmentId: string): Promise<TeacherAssignment> {
  const { data } = await apiClient.get<TeacherAssignment>(`/teacher-assignments/${assignmentId}`);
  return data;
}

export async function createAssignment(input: TeacherAssignmentCreate): Promise<TeacherAssignment> {
  const { data } = await apiClient.post<TeacherAssignment>("/teacher-assignments", input);
  return data;
}

export async function updateAssignment(
  assignmentId: string,
  input: TeacherAssignmentUpdate,
): Promise<TeacherAssignment> {
  const { data } = await apiClient.patch<TeacherAssignment>(`/teacher-assignments/${assignmentId}`, input);
  return data;
}

export async function endAssignment(
  assignmentId: string,
  version: number,
): Promise<TeacherAssignment> {
  const { data } = await apiClient.delete<TeacherAssignment>(`/teacher-assignments/${assignmentId}`, {
    data: { version },
  });
  return data;
}
