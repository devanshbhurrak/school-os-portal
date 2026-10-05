import { apiClient } from "./api-client";
import type {
  CursorPage,
  PeriodDefinition,
  PeriodDefinitionCreate,
  PeriodDefinitionUpdate,
  PublishResult,
  Timetable,
  TimetableCreate,
  TimetableSlot,
  TimetableSlotCreate,
  TimetableSlotListParams,
  TimetableSlotUpdate,
  TimetableUpdate,
} from "@/types";

// ---------------------------------------------------------------------------
// Timetable Header
// ---------------------------------------------------------------------------

export async function listTimetables(
  params?: { academic_year_id?: string; status?: string },
): Promise<CursorPage<Timetable>> {
  const { data } = await apiClient.get<CursorPage<Timetable>>("/timetables", { params });
  return data;
}

export async function getTimetable(id: string): Promise<Timetable> {
  const { data } = await apiClient.get<Timetable>(`/timetables/${id}`);
  return data;
}

export async function createTimetable(payload: TimetableCreate): Promise<Timetable> {
  const { data } = await apiClient.post<Timetable>("/timetables", payload);
  return data;
}

export async function updateTimetable(id: string, payload: TimetableUpdate): Promise<Timetable> {
  const { data } = await apiClient.patch<Timetable>(`/timetables/${id}`, payload);
  return data;
}

export async function publishTimetable(id: string, version: number): Promise<PublishResult> {
  const { data } = await apiClient.post<PublishResult>(`/timetables/${id}/publish`, { version });
  return data;
}

export async function archiveTimetable(id: string, version: number): Promise<Timetable> {
  const { data } = await apiClient.post<Timetable>(`/timetables/${id}/archive`, { version });
  return data;
}

// ---------------------------------------------------------------------------
// Period Definitions
// ---------------------------------------------------------------------------

export async function listPeriodDefinitions(
  academicYearId: string,
): Promise<CursorPage<PeriodDefinition>> {
  const { data } = await apiClient.get<CursorPage<PeriodDefinition>>(
    "/period-definitions",
    { params: { academic_year_id: academicYearId } },
  );
  return data;
}

export async function createPeriodDefinition(
  input: PeriodDefinitionCreate,
): Promise<PeriodDefinition> {
  const { data } = await apiClient.post<PeriodDefinition>("/period-definitions", input);
  return data;
}

export async function updatePeriodDefinition(
  id: string,
  input: PeriodDefinitionUpdate,
): Promise<PeriodDefinition> {
  const { data } = await apiClient.patch<PeriodDefinition>(`/period-definitions/${id}`, input);
  return data;
}

export async function deletePeriodDefinition(id: string): Promise<void> {
  await apiClient.delete(`/period-definitions/${id}`);
}

export async function listTimetableSlots(
  params: TimetableSlotListParams = {},
): Promise<CursorPage<TimetableSlot>> {
  const { data } = await apiClient.get<CursorPage<TimetableSlot>>("/timetable-slots", { params });
  return data;
}

export async function getTimetableSlot(id: string): Promise<TimetableSlot> {
  const { data } = await apiClient.get<TimetableSlot>(`/timetable-slots/${id}`);
  return data;
}

export async function createTimetableSlot(
  input: TimetableSlotCreate,
): Promise<TimetableSlot> {
  const { data } = await apiClient.post<TimetableSlot>("/timetable-slots", input);
  return data;
}

export async function updateTimetableSlot(
  id: string,
  input: TimetableSlotUpdate,
): Promise<TimetableSlot> {
  const { data } = await apiClient.patch<TimetableSlot>(`/timetable-slots/${id}`, input);
  return data;
}

export async function cancelTimetableSlot(id: string): Promise<TimetableSlot> {
  const { data } = await apiClient.delete<TimetableSlot>(`/timetable-slots/${id}`);
  return data;
}
