import { apiClient } from "./api-client";

export interface SearchStudentResult {
  id: string;
  admission_number: string;
  status: string;
  first_name: string;
  last_name: string | null;
  person_id: string;
}

export interface SearchTeacherResult {
  id: string;
  employee_number: string | null;
  designation: string | null;
  status: string;
  first_name: string;
  last_name: string | null;
  person_id: string;
}

export interface GlobalSearchResults {
  students: SearchStudentResult[];
  teachers: SearchTeacherResult[];
}

export async function searchAll(
  q: string,
  limit = 20,
): Promise<GlobalSearchResults> {
  const { data } = await apiClient.get<GlobalSearchResults>("/search", {
    params: { q, limit },
  });
  return data;
}
