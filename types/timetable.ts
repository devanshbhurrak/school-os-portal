export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type PeriodType = "LESSON" | "BREAK" | "LUNCH" | "ASSEMBLY" | "FREE" | "EXAM";
export type TimetableSlotStatus = "ACTIVE" | "CANCELLED" | "SUBSTITUTED";

export interface PeriodDefinition {
  id: string;
  school_id: string;
  organization_id: string;
  academic_year_id: string;
  name: string;
  period_type: PeriodType;
  start_time: string; // "HH:MM:SS"
  end_time: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PeriodDefinitionCreate {
  academic_year_id: string;
  name: string;
  period_type: PeriodType;
  start_time: string;
  end_time: string;
  sort_order?: number;
}

export interface PeriodDefinitionUpdate {
  name?: string;
  period_type?: PeriodType;
  start_time?: string;
  end_time?: string;
  sort_order?: number;
}

export interface TimetableSlot {
  id: string;
  school_id: string;
  organization_id: string;
  academic_year_id: string;
  cohort_id: string;
  period_definition_id: string;
  teacher_id: string;
  subject_id: string;
  day_of_week: DayOfWeek;
  effective_from: string;
  effective_to: string | null;
  status: TimetableSlotStatus;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  // denormalized
  teacher_name?: string;
  subject_name?: string;
  cohort_name?: string;
  period_name?: string;
}

export interface TimetableSlotCreate {
  cohort_id: string;
  period_definition_id: string;
  teacher_id: string;
  subject_id: string;
  day_of_week: DayOfWeek;
  effective_from: string;
  effective_to?: string;
  notes?: string;
}

export interface TimetableSlotUpdate {
  teacher_id?: string;
  subject_id?: string;
  effective_to?: string | null;
  status?: TimetableSlotStatus;
  notes?: string | null;
  version: number;
}

export interface TimetableSlotListParams {
  cohort_id?: string;
  teacher_id?: string;
  academic_year_id?: string;
  day_of_week?: DayOfWeek;
  cursor?: string;
  limit?: number;
}
