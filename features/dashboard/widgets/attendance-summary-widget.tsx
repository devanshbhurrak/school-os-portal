"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTodayAttendanceSummary } from "@/services/attendance";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AttendanceSummaryWidget() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";

  const { data, isPending, isError } = useQuery({
    queryKey: schoolKeys.attendanceTodaySummary(schoolId),
    queryFn: getTodayAttendanceSummary,
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const attendanceRate =
    data && data.records_total > 0
      ? Math.round((data.records_present / data.records_total) * 100)
      : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarCheck className="size-4" aria-hidden />
          Today&apos;s Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {data.sessions_submitted} of {data.sessions_total} sessions submitted
            </p>
            {data.records_total > 0 && (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${attendanceRate ?? 0}%` }}
                    role="progressbar"
                    aria-valuenow={attendanceRate ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <p className="text-sm font-medium">
                  {attendanceRate !== null ? `${attendanceRate}% present` : "—"}
                </p>
              </>
            )}
            {data.records_total === 0 && data.sessions_total === 0 && (
              <p className="text-sm text-muted-foreground">No sessions today</p>
            )}
            <Link
              href="/attendance"
              className="inline-block text-xs text-primary hover:underline"
            >
              View attendance →
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
