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
  params: AttendanceSessionListParams = {},
): Promise<CursorPage<AttendanceSession>> {
  const { data } = await apiClient.get<CursorPage<AttendanceSession>>(
    "/attendance-sessions",
    { params },
  );
  return data;
}

export async function getSession(
  id: string,
): Promise<AttendanceSession> {
  const { data } = await apiClient.get<AttendanceSession>(`/attendance-sessions/${id}`);
  return data;
}

export async function createSession(
  input: AttendanceSessionCreate,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>("/attendance-sessions", input);
  return data;
}

export async function updateSession(
  id: string,
  input: AttendanceSessionUpdate,
): Promise<AttendanceSession> {
  const { data } = await apiClient.patch<AttendanceSession>(
    `/attendance-sessions/${id}`,
    input,
  );
  return data;
}

export async function deleteSession(
  id: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/attendance-sessions/${id}`, { data: { version } });
}

export async function submitSession(
  id: string,
  version: number,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>(
    `/attendance-sessions/${id}/submit`,
    { version },
  );
  return data;
}

export async function amendSession(
  id: string,
  version: number,
): Promise<AttendanceSession> {
  const { data } = await apiClient.post<AttendanceSession>(
    `/attendance-sessions/${id}/amend`,
    { version },
  );
  return data;
}

export async function listRecords(
  sessionId: string,
): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<AttendanceRecord[]>(
    `/attendance-sessions/${sessionId}/records`,
  );
  return data;
}

export async function updateRecord(
  id: string,
  input: AttendanceRecordUpdate,
): Promise<AttendanceRecord> {
  const { data } = await apiClient.patch<AttendanceRecord>(
    `/attendance-records/${id}`,
    input,
  );
  return data;
}

export async function bulkUpdateRecords(
  sessionId: string,
  input: BulkRecordUpdate,
): Promise<void> {
  await apiClient.post(`/attendance-sessions/${sessionId}/bulk-update`, input);
}

export interface AttendanceTodaySummary {
  sessions_total: number;
  sessions_submitted: number;
  records_present: number;
  records_absent: number;
  records_total: number;
}

export async function getTodayAttendanceSummary(): Promise<AttendanceTodaySummary> {
  const { data } = await apiClient.get<AttendanceTodaySummary>("/attendance/today-summary");
  return data;
}
