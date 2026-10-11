"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { listTimetableSlots } from "@/services";
import type { TimetableSlot } from "@/types";

const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

/** Read-only weekly schedule for one teacher (B3). */
export function TeacherTimetableTab({ teacherId }: { teacherId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";

  const slotsQuery = useQuery({
    queryKey: schoolKeys.timetableSlots(schoolId, { teacher_id: teacherId, limit: 100 }),
    queryFn: () => listTimetableSlots({ teacher_id: teacherId, limit: 100 }),
    enabled: !!schoolId && !!teacherId,
    staleTime: STALE_TIME.frequent,
  });

  if (slotsQuery.isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (slotsQuery.isError) {
    return (
      <ErrorState error={slotsQuery.error} onRetry={() => void slotsQuery.refetch()} />
    );
  }

  const slots = (slotsQuery.data?.items ?? []).filter(
    (s: TimetableSlot) => s.status === "ACTIVE" || s.status === "SUBSTITUTED",
  );

  if (slots.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No scheduled classes"
        description="This teacher has no published timetable slots yet."
      />
    );
  }

  const byDay = new Map<string, TimetableSlot[]>();
  for (const slot of slots) {
    const list = byDay.get(slot.day_of_week) ?? [];
    list.push(slot);
    byDay.set(slot.day_of_week, list);
  }

  return (
    <div className="space-y-4">
      {WEEKDAYS.filter((day) => byDay.has(day)).map((day) => (
        <div key={day}>
          <h3 className="mb-2 text-sm font-semibold">{DAY_LABELS[day] ?? day}</h3>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {(byDay.get(day) ?? []).map((slot) => (
                  <li key={slot.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {slot.subject_name ?? "Class"}
                        {slot.cohort_name ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            • {slot.cohort_name}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[slot.period_name, slot.notes].filter(Boolean).join(" • ") || "—"}
                      </p>
                    </div>
                    {slot.status === "SUBSTITUTED" && (
                      <Badge variant="secondary">Substituted</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
