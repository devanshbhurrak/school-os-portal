"use client";

import { GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getStudentCounts } from "@/services/students";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StudentCountWidget() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";

  const { data, isPending, isError } = useQuery({
    queryKey: schoolKeys.studentCounts(schoolId),
    queryFn: getStudentCounts,
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex size-10 items-center justify-center rounded-full bg-muted">
          <GraduationCap className="size-5 text-muted-foreground" aria-hidden />
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
          <p className="text-sm text-muted-foreground">Active students</p>
        </div>
      </CardContent>
    </Card>
  );
}
