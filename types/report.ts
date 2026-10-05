export type ExportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ReportType = "STUDENTS" | "TEACHERS" | "ATTENDANCE_SUMMARY" | "ENROLLMENTS";

export interface ExportJob {
  id: string;
  school_id: string;
  report_type: ReportType;
  status: ExportJobStatus;
  filters: Record<string, unknown> | null;
  row_count: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
  created_at: string;
}
