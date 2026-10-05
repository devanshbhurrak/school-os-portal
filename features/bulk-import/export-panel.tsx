"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSchoolContext } from "@/hooks/use-school-context";
import {
  requestExport,
  listExportJobs,
  downloadExport,
} from "@/services/reports";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PERMISSIONS } from "@/lib/permissions";
import { schoolKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import type { ReportType, ExportJob } from "@/types/report";

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const REPORT_TYPES: { type: ReportType; label: string }[] = [
  { type: "STUDENTS", label: "Export Students (CSV)" },
  { type: "TEACHERS", label: "Export Teachers (CSV)" },
  { type: "ATTENDANCE_SUMMARY", label: "Export Attendance Summary (CSV)" },
  { type: "ENROLLMENTS", label: "Export Enrollments (CSV)" },
];

export function ExportPanel() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? null;
  const queryClient = useQueryClient();
  const [exportingType, setExportingType] = useState<ReportType | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: jobsPage } = useQuery({
    queryKey: schoolKeys.exportJobs(schoolId ?? ""),
    queryFn: () => listExportJobs({ limit: 20 }),
    enabled: !!schoolId,
    refetchInterval: (query) => {
      const items = query.state.data?.items;
      if (!items) return false;
      const hasPending = items.some(
        (j) => j.status === "PENDING" || j.status === "PROCESSING",
      );
      return hasPending ? 5000 : false;
    },
  });

  const exportMutation = useMutation({
    mutationFn: (reportType: ReportType) =>
      requestExport({ report_type: reportType }),
    onSuccess: (_job) => {
      queryClient.invalidateQueries({
        queryKey: schoolKeys.exportJobs(schoolId ?? ""),
      });
    },
    onSettled: () => setExportingType(null),
  });

  async function handleExport(reportType: ReportType) {
    if (!schoolId) return;
    setExportingType(reportType);
    exportMutation.mutate(reportType);
  }

  async function handleDownload(job: ExportJob) {
    setDownloadingId(job.id);
    try {
      const blob = await downloadExport(job.id);
      triggerBlobDownload(blob, `${job.report_type}_${job.id}.csv`);
    } finally {
      setDownloadingId(null);
    }
  }

  const jobs = jobsPage?.items ?? [];

  return (
    <PermissionGate permission={PERMISSIONS.report.create}>
      <div className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            Download all records for this school as a CSV file.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            {REPORT_TYPES.map(({ type, label }) => (
              <Button
                key={type}
                variant="outline"
                disabled={exportingType === type}
                onClick={() => handleExport(type)}
              >
                {exportingType === type ? "Exporting..." : label}
              </Button>
            ))}
          </div>
        </div>

        {jobs.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Recent exports</h3>
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between border rounded-md px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{job.report_type}</span>
                    <span
                      className={
                        job.status === "COMPLETED"
                          ? "text-green-600"
                          : job.status === "FAILED"
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }
                    >
                      {job.status}
                    </span>
                    {job.row_count != null && (
                      <span className="text-muted-foreground">
                        {job.row_count} rows
                      </span>
                    )}
                    {job.error_message && (
                      <span className="text-red-600 text-xs truncate max-w-[200px]">
                        {job.error_message}
                      </span>
                    )}
                  </div>
                  {job.status === "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={downloadingId === job.id}
                      onClick={() => handleDownload(job)}
                    >
                      {downloadingId === job.id ? "Downloading..." : "Download"}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
