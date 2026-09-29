"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getSession,
  listRecords,
  updateRecord,
  submitSession,
  amendSession,
  bulkUpdateRecords,
} from "@/services/attendance";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "HOLIDAY"];

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  PRESENT: "text-emerald-700 bg-emerald-50",
  ABSENT: "text-red-700 bg-red-50",
  LATE: "text-amber-700 bg-amber-50",
  EXCUSED: "text-blue-700 bg-blue-50",
  HOLIDAY: "text-gray-500 bg-gray-50",
};

interface LocalRecord {
  id: string;
  enrollment_id: string;
  student_id: string;
  student_name?: string;
  status: AttendanceStatus;
  arrived_at: string | null;
  notes: string | null;
}

export function AttendanceSheet({ sessionId }: { sessionId: string }) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [localRecords, setLocalRecords] = useState<LocalRecord[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const { data: session, isLoading: sessionLoading, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.attendanceSession(schoolId, sessionId),
    queryFn: () => getSession(schoolId, sessionId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.entity,
  });

  const { data: records, isLoading: recordsLoading } = useQuery({
    queryKey: schoolKeys.attendanceRecords(schoolId, sessionId),
    queryFn: () => listRecords(schoolId, sessionId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (records) {
      setLocalRecords(
        records.map((r) => ({
          id: r.id,
          enrollment_id: r.enrollment_id,
          student_id: r.student_id,
          student_name: r.student_name,
          status: r.status,
          arrived_at: r.arrived_at,
          notes: r.notes,
        })),
      );
      setIsDirty(false);
    }
  }, [records]);

  const isEditable =
    session?.status === "DRAFT" || session?.status === "AMENDED";

  const handleStatusChange = useCallback(
    (enrollmentId: string, status: AttendanceStatus) => {
      setLocalRecords((prev) =>
        prev.map((r) =>
          r.enrollment_id === enrollmentId
            ? { ...r, status, arrived_at: status !== "LATE" ? null : r.arrived_at }
            : r,
        ),
      );
      setIsDirty(true);
    },
    [],
  );

  const handleArrivedAtChange = useCallback(
    (enrollmentId: string, value: string) => {
      setLocalRecords((prev) =>
        prev.map((r) =>
          r.enrollment_id === enrollmentId ? { ...r, arrived_at: value || null } : r,
        ),
      );
      setIsDirty(true);
    },
    [],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      bulkUpdateRecords(schoolId, sessionId, {
        records: localRecords.map((r) => ({
          enrollment_id: r.enrollment_id,
          status: r.status,
          arrived_at: r.arrived_at ?? null,
          notes: r.notes,
        })),
      }),
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Attendance saved");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.attendanceRecords(schoolId, sessionId) });
    },
    onError: (e: unknown) => showMutationError(e),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitSession(schoolId, sessionId, session!.version),
    onSuccess: () => {
      toast.success("Attendance submitted");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.attendanceSession(schoolId, sessionId) });
    },
    onError: (e: unknown) => showMutationError(e),
  });

  const amendMutation = useMutation({
    mutationFn: () => amendSession(schoolId, sessionId, session!.version),
    onSuccess: () => {
      toast.success("Session re-opened for amendments");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.attendanceSession(schoolId, sessionId) });
    },
    onError: (e: unknown) => showMutationError(e),
  });

  if (sessionLoading || recordsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !session) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {formatDate(session.session_date)}
            </CardTitle>
            <StatusBadge status={session.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {localRecords.length} student{localRecords.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <PermissionGate permission={PERMISSIONS.attendance.record.update}>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!isEditable || !isDirty || saveMutation.isPending}
              variant="outline"
            >
              Save
            </Button>
          </PermissionGate>

          {session.status === "DRAFT" && (
            <PermissionGate permission={PERMISSIONS.attendance.session.submit}>
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
              >
                Submit
              </Button>
            </PermissionGate>
          )}

          {(session.status === "SUBMITTED" || session.status === "AMENDED") && (
            <PermissionGate permission={PERMISSIONS.attendance.session.amend}>
              <Button
                variant="outline"
                onClick={() => amendMutation.mutate()}
                disabled={amendMutation.isPending || session.status === "AMENDED"}
              >
                Amend
              </Button>
            </PermissionGate>
          )}
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Arrived at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localRecords.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {record.student_name ?? record.student_id}
              </TableCell>
              <TableCell>
                {isEditable ? (
                  <Select
                    value={record.status}
                    onValueChange={(v) =>
                      handleStatusChange(record.enrollment_id, v as AttendanceStatus)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-36 text-xs font-medium",
                        STATUS_COLORS[record.status],
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={cn(
                      "inline-block rounded px-2 py-0.5 text-xs font-medium",
                      STATUS_COLORS[record.status],
                    )}
                  >
                    {record.status}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {record.status === "LATE" && isEditable ? (
                  <Input
                    type="time"
                    value={record.arrived_at ?? ""}
                    onChange={(e) =>
                      handleArrivedAtChange(record.enrollment_id, e.target.value)
                    }
                    className="w-32"
                  />
                ) : record.status === "LATE" && record.arrived_at ? (
                  <span className="text-sm">{record.arrived_at}</span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
