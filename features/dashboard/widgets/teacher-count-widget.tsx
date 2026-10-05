"use client";

import { Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getTeacherCounts } from "@/services/teachers";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TeacherCountWidget() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";

  const { data, isPending, isError } = useQuery({
    queryKey: schoolKeys.teacherCounts(schoolId),
    queryFn: getTeacherCounts,
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <Users className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold">
            {isPending ? (
              <Skeleton className="h-6 w-12" />
            ) : isError ? (
              "—"
            ) : (
              data.active.toLocaleString()
            )}
          </p>
          <p className="text-sm text-muted-foreground">Active teachers</p>
        </div>
      </CardContent>
    </Card>
  );
}
