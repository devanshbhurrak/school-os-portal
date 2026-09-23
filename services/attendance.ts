import { apiClient } from "./api-client";
import type { CursorPage } from "@/types";
import type {
  AttendanceRecord,
  AttendanceRecordUpdate,
  AttendanceSession,
  AttendanceSessionCreate,
  AttendanceSessionListParams,
  AttendanceSessionUpdate,
  BulkRecordUpdate,
} from "@/types/attendance";

export async function listSessions(
  schoolId: string,
  params: AttendanceSessionListParams = {},
): Promise<CursorPage<AttendanceSession>> {
  const { data } = await apiClient.get<CursorPage<AttendanceSession>>(
    "/attendance-sessions",
    { params, headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function getSession(
  schoolId: string,
  id: string,
): Promise<AttendanceSession> {
  const { data } = await apiClient.get<AttendanceSession>(
    `/attendance-sessions/${id}`,
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function createSession(
  schoolId: string,
  input: AttendanceSessionCreate,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>(
    "/attendance-sessions",
    input,
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function updateSession(
  schoolId: string,
  id: string,
  input: AttendanceSessionUpdate,
): Promise<AttendanceSession> {
  const { data } = await apiClient.patch<AttendanceSession>(
    `/attendance-sessions/${id}`,
    input,
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function deleteSession(
  schoolId: string,
  id: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/attendance-sessions/${id}`, {
    data: { version },
    headers: { "X-School-ID": schoolId },
  });
}

export async function submitSession(
  schoolId: string,
  id: string,
  version: number,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>(
    `/attendance-sessions/${id}/submit`,
    { version },
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function amendSession(
  schoolId: string,
  id: string,
  version: number,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>(
    `/attendance-sessions/${id}/amend`,
    { version },
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function listRecords(
  schoolId: string,
  sessionId: string,
): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<AttendanceRecord[]>(
    `/attendance-sessions/${sessionId}/records`,
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function updateRecord(
  schoolId: string,
  id: string,
  input: AttendanceRecordUpdate,
): Promise<AttendanceRecord> {
  const { data } = await apiClient.patch<AttendanceRecord>(
    `/attendance-records/${id}`,
    input,
    { headers: { "X-School-ID": schoolId } },
  );
  return data;
}

export async function bulkUpdateRecords(
  schoolId: string,
  sessionId: string,
  input: BulkRecordUpdate,
): Promise<void> {
  await apiClient.post(
    `/attendance-sessions/${sessionId}/bulk-update`,
    input,
    { headers: { "X-School-ID": schoolId } },
  );
}
