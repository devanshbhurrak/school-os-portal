"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { listSessions } from "@/services/attendance";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StudentAttendanceTab({ studentId }: { studentId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();

  const { data: sessionsPage, isLoading } = useQuery({
    queryKey: schoolKeys.studentAttendance(schoolId, studentId),
    queryFn: () => listSessions({ limit: 100 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });
  const sessions = sessionsPage?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          No attendance records found for this student.
        </CardContent>
      </Card>
    );
  }

  const presentCount = sessions.filter((s) => s.status === "SUBMITTED" || s.status === "AMENDED").length;
  const totalSessions = sessions.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-semibold">{totalSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Submitted</p>
            <p className="text-2xl font-semibold text-emerald-700">{presentCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Draft</p>
            <p className="text-2xl font-semibold text-gray-500">
              {totalSessions - presentCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((s) => (
            <TableRow
              key={s.id}
              className="cursor-pointer"
              onClick={() => router.push(`/attendance/${s.id}`)}
            >
              <TableCell>{formatDate(s.session_date)}</TableCell>
              <TableCell>
                <StatusBadge status={s.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{s.notes ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
