"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import {
  downloadExport,
  getExportJob,
  listExportJobs,
  requestExport,
} from "@/services/reports";
import type { ExportJob, ReportType } from "@/types/report";

const REPORT_CARDS: { type: ReportType; title: string; description: string }[] = [
  {
    type: "STUDENTS",
    title: "Student list",
    description: "All active students with admission details.",
  },
  {
    type: "ATTENDANCE_SUMMARY",
    title: "Attendance summary",
    description: "Aggregated attendance per student and section.",
  },
  {
    type: "TEACHERS",
    title: "Teacher list",
    description: "All teachers with designation and joining dates.",
  },
  {
    type: "ENROLLMENTS",
    title: "Enrollments",
    description: "Student-section enrollments for the active year.",
  },
];

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ReportCard({ type, title, description }: { type: ReportType; title: string; description: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    try {
      // Small exports: request then download directly as CSV.
      const job = await requestExport({ report_type: type });
      // Large exports: poll until the job completes, then download.
      let current = job;
      for (let i = 0; i < 30 && (current.status === "PENDING" || current.status === "PROCESSING"); i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        current = await getExportJob(job.id);
      }
      if (current.status === "FAILED") {
        toast.error("Export failed", {
          description: current.error_message ?? "The report could not be generated.",
        });
        return;
      }
      const blob = await downloadExport(current.id);
      triggerBlobDownload(blob, `${type.toLowerCase()}-report.csv`);
      toast.success("Report downloaded");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.exportJobs(schoolId) });
    } catch (error) {
      showMutationError(error);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="size-4 text-muted-foreground" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <PermissionGate permission={PERMISSIONS.report.create}>
          <Button size="sm" onClick={handleExport} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {pending ? "Generating…" : "Export CSV"}
          </Button>
        </PermissionGate>
      </CardContent>
    </Card>
  );
}

function ExportJobsTable() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const jobsQuery = useQuery({
    queryKey: schoolKeys.exportJobs(schoolId),
    queryFn: () => listExportJobs({ limit: 20 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const active = items.some((j: ExportJob) => j.status === "PENDING" || j.status === "PROCESSING");
      return active ? 3000 : false;
    },
  });

  async function handleRedownload(job: ExportJob) {
    try {
      const blob = await downloadExport(job.id);
      triggerBlobDownload(blob, `${job.report_type.toLowerCase()}-report.csv`);
    } catch (error) {
      showMutationError(error);
    }
  }

  if (jobsQuery.isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  if (jobsQuery.isError) {
    return <ErrorState error={jobsQuery.error} onRetry={() => void jobsQuery.refetch()} />;
  }

  const jobs = jobsQuery.data?.items ?? [];
  if (jobs.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No exports yet"
        description="Generate a report above — it will appear here for re-download."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold">Recent exports</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void queryClient.invalidateQueries({ queryKey: schoolKeys.exportJobs(schoolId) })}
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Refresh
          </Button>
        </div>
        <ul className="divide-y">
          {jobs.map((job: ExportJob) => (
            <li key={job.id} className="flex items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{job.report_type}</p>
                <p className="text-xs text-muted-foreground">
                  {job.row_count != null ? `${job.row_count} rows • ` : ""}
                  {formatDateTime(job.created_at)}
                  {job.error_message ? ` • ${job.error_message}` : ""}
                </p>
              </div>
              <Badge
                variant={
                  job.status === "COMPLETED"
                    ? "default"
                    : job.status === "FAILED"
                      ? "destructive"
                      : "secondary"
                }
              >
                {job.status}
              </Badge>
              {job.status === "COMPLETED" && (
                <Button variant="outline" size="sm" onClick={() => void handleRedownload(job)}>
                  <Download className="size-3.5" aria-hidden />
                  CSV
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {REPORT_CARDS.map((card) => (
          <ReportCard key={card.type} {...card} />
        ))}
      </div>
      <ExportJobsTable />
    </div>
  );
}

// Re-export for tests without pulling the whole feature barrel.
export { triggerBlobDownload };
