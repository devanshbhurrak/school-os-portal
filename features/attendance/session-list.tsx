"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { listSessions, createSession } from "@/services/attendance";
import { listCohorts, listAcademicYears } from "@/services";
import type { AttendanceSessionStatus } from "@/types/attendance";
import { useSchoolContext } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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

export function SessionList() {
  const { activeSchool } = useSchoolContext();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [selectedYearId, setSelectedYearId] = useState<string>("");

  const { data: yearsPage } = useQuery({
    queryKey: schoolKeys.years(schoolId),
    queryFn: () => listAcademicYears({ limit: 50 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.config,
  });
  const years = yearsPage?.items ?? [];

  const { data: cohortsPage } = useQuery({
    queryKey: schoolKeys.cohorts(schoolId),
    queryFn: () => listCohorts({ limit: 200 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.config,
  });
  const cohorts = cohortsPage?.items ?? [];

  const sessionsParams = {
    cohort_id: selectedCohortId || undefined,
    academic_year_id: selectedYearId || undefined,
    limit: 50,
  };

  const { data: sessionsPage, isLoading } = useQuery({
    queryKey: schoolKeys.attendanceSessions(schoolId, sessionsParams),
    queryFn: () => listSessions(sessionsParams),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });
  const sessions = sessionsPage?.items ?? [];

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCohortId || !selectedYearId) {
        throw new Error("Select a cohort and academic year first.");
      }
      const today = new Date().toISOString().split("T")[0];
      return createSession({
        cohort_id: selectedCohortId,
        academic_year_id: selectedYearId,
        session_date: today,
      });
    },
    onSuccess: (session) => {
      void queryClient.invalidateQueries({ queryKey: schoolKeys.attendanceSessions(schoolId) });
      router.push(`/attendance/${session.id}`);
    },
    onError: (e: unknown) => showMutationError(e),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5 w-48">
          <Label>Academic year</Label>
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger>
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All years</SelectItem>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-48">
          <Label>Section (cohort)</Label>
          <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
            <SelectTrigger>
              <SelectValue placeholder="All sections" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All sections</SelectItem>
              {cohorts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <PermissionGate permission={PERMISSIONS.attendance.session.create}>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !selectedCohortId || !selectedYearId}
          >
            <Plus className="size-4" />
            Take Attendance
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted-foreground">
            No attendance sessions found. Use &quot;Take Attendance&quot; to create one.
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Records</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                onClick={() => router.push(`/attendance/${s.id}`)}
              >
                <TableCell className="font-medium">{formatDate(s.session_date)}</TableCell>
                <TableCell>{s.cohort_id}</TableCell>
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>
                <TableCell>{s.record_count ?? "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/attendance/${s.id}`);
                    }}
                  >
                    Open
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
