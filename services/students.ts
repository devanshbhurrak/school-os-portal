import { apiClient } from "./api-client";
import type { CursorPage, Student, StudentCreate, StudentListParams, StudentUpdate } from "@/types";

export async function listStudents(
  params: StudentListParams = {},
): Promise<CursorPage<Student>> {
  const { data } = await apiClient.get<CursorPage<Student>>("/students", { params });
  return data;
}

export async function getStudent(studentId: string): Promise<Student> {
  const { data } = await apiClient.get<Student>(`/students/${studentId}`);
  return data;
}

export async function createStudent(input: StudentCreate): Promise<Student> {
  const { data } = await apiClient.post<Student>("/students", input);
  return data;
}

export async function updateStudent(studentId: string, input: StudentUpdate): Promise<Student> {
  const { data } = await apiClient.patch<Student>(`/students/${studentId}`, input);
  return data;
}

export async function deleteStudent(studentId: string, version: number): Promise<void> {
  await apiClient.delete(`/students/${studentId}`, { data: { version } });
}

export async function getStudentCounts(): Promise<{ active: number; total: number }> {
  const { data } = await apiClient.get<{ active: number; total: number }>("/students/counts");
  return data;
}
