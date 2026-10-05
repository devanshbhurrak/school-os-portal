export type ImportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PARTIAL"
export type ImportResourceType = "students" | "teachers"

export interface ImportErrorRow {
  row: number
  field: string
  message: string
}

export interface ImportJob {
  id: string
  school_id: string
  resource_type: ImportResourceType
  status: ImportJobStatus
  total_rows: number | null
  processed_rows: number
  success_rows: number
  failed_rows: number
  error_summary: ImportErrorRow[] | null
  original_filename: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  organization_id: string
}
