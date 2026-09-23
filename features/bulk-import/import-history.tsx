"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { listImportJobs } from "@/services/import-jobs";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PERMISSIONS } from "@/lib/permissions";
import type { ImportJob } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatusBadge({ status }: { status: ImportJob["status"] }) {
  const variants: Record<ImportJob["status"], string> = {
    COMPLETED: "bg-green-100 text-green-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    FAILED: "bg-red-100 text-red-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    PENDING: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[status]}`}>
      {status}
    </span>
  );
}

export function ImportHistory() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? null;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: schoolKeys.importJobs(schoolId ?? ""),
    queryFn: () => listImportJobs(schoolId!),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  return (
    <PermissionGate permission={PERMISSIONS.bulkImport.import.list}>
      <div className="space-y-4">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && jobs.length === 0 && (
          <p className="text-sm text-muted-foreground">No import jobs found.</p>
        )}
        {jobs.length > 0 && (
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Success</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <>
                    <TableRow
                      key={job.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                    >
                      <TableCell className="capitalize">{job.resource_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                        {job.original_filename ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>{job.total_rows ?? "—"}</TableCell>
                      <TableCell>{job.success_rows}</TableCell>
                      <TableCell>{job.failed_rows}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    {expandedId === job.id && job.error_summary && job.error_summary.length > 0 && (
                      <TableRow key={`${job.id}-errors`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <p className="text-xs font-semibold mb-2">Errors ({job.error_summary.length})</p>
                          <div className="space-y-1">
                            {job.error_summary.map((err, i) => (
                              <div key={i} className="text-xs text-muted-foreground">
                                Row {err.row} · <span className="font-medium">{err.field}</span>: {err.message}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
