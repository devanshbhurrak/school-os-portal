export type AttendanceSessionStatus = "DRAFT" | "SUBMITTED" | "AMENDED"
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "HOLIDAY"

export interface AttendanceSession {
  id: string
  school_id: string
  organization_id: string
  cohort_id: string
  academic_year_id: string
  session_date: string
  status: AttendanceSessionStatus
  submitted_at: string | null
  submitted_by_id: string | null
  notes: string | null
  version: number
  record_count?: number
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  school_id: string
  organization_id: string
  session_id: string
  enrollment_id: string
  student_id: string
  status: AttendanceStatus
  arrived_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  student_name?: string
}

export interface AttendanceSessionCreate {
  cohort_id: string
  academic_year_id: string
  session_date: string
  notes?: string
}

export interface AttendanceSessionUpdate {
  notes?: string | null
  status?: AttendanceSessionStatus
  version: number
}

export interface AttendanceRecordUpdate {
  status: AttendanceStatus
  arrived_at?: string | null
  notes?: string | null
}

export interface BulkRecordUpdateItem {
  enrollment_id: string
  status: AttendanceStatus
  arrived_at?: string | null
  notes?: string | null
}

export interface BulkRecordUpdate {
  records: BulkRecordUpdateItem[]
}

export interface AttendanceSessionListParams {
  cohort_id?: string
  academic_year_id?: string
  status?: AttendanceSessionStatus
  from_date?: string
  to_date?: string
  limit?: number
  cursor?: string
}
