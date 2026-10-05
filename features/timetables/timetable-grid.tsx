"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { listPeriodDefinitions, listTimetableSlots, cancelTimetableSlot } from "@/services";
import type { PeriodDefinition, TimetableSlot } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { SlotFormDialog } from "./slot-form-dialog";
import { toast } from "sonner";
import { showMutationError } from "@/lib/error-messages";

const WEEKDAYS: { key: string; label: string }[] = [
  { key: "MONDAY", label: "Mon" },
  { key: "TUESDAY", label: "Tue" },
  { key: "WEDNESDAY", label: "Wed" },
  { key: "THURSDAY", label: "Thu" },
  { key: "FRIDAY", label: "Fri" },
];

interface TimetableGridProps {
  cohortId: string;
  academicYearId: string;
  subjects: { id: string; name: string }[];
}

export function TimetableGrid({ cohortId, academicYearId, subjects }: TimetableGridProps) {
  const { activeSchool } = useSchoolContext();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [createCell, setCreateCell] = useState<{ day: string; periodId: string } | null>(null);
  const [editSlot, setEditSlot] = useState<TimetableSlot | null>(null);
  const [cancelSlot, setCancelSlot] = useState<TimetableSlot | null>(null);

  const { data: periodsPage, isLoading: periodsLoading } = useQuery({
    queryKey: schoolKeys.periodDefinitions(schoolId, academicYearId),
    queryFn: () => listPeriodDefinitions(academicYearId),
    enabled: !!schoolId && !!academicYearId,
    staleTime: STALE_TIME.config,
  });
  const periods = (periodsPage?.items ?? []).sort((a, b) => a.sort_order - b.sort_order);

  const slotsQueryKey = schoolKeys.timetableSlots(schoolId, {
    cohort_id: cohortId,
    academic_year_id: academicYearId,
  });

  const { data: slotsPage, isLoading: slotsLoading } = useQuery({
    queryKey: slotsQueryKey,
    queryFn: () => listTimetableSlots({ cohort_id: cohortId, academic_year_id: academicYearId }),
    enabled: !!schoolId && !!cohortId && !!academicYearId,
    staleTime: STALE_TIME.frequent,
  });
  const slots = slotsPage?.items ?? [];

  // Show ACTIVE and SUBSTITUTED slots — SUBSTITUTED means another slot is covering it,
  // but it still represents an assigned time that should be visible.
  const slotMap = new Map<string, TimetableSlot>();
  for (const slot of slots) {
    if (slot.status === "ACTIVE" || slot.status === "SUBSTITUTED") {
      slotMap.set(`${slot.period_definition_id}:${slot.day_of_week}`, slot);
    }
  }

  async function handleCancel() {
    if (!cancelSlot) return;
    try {
      // The DELETE endpoint returns the updated (cancelled) slot — use it to update the cache
      // immediately so the grid reflects the change without a full refetch.
      const cancelled = await cancelTimetableSlot(cancelSlot.id);
      queryClient.setQueryData(slotsQueryKey, (old: typeof slotsPage) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((s) => (s.id === cancelled.id ? cancelled : s)),
        };
      });
      toast.success("Timetable slot cancelled");
      setCancelSlot(null);
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.timetables.slot.create);
  const isLoading = periodsLoading || slotsLoading;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No period definitions found for this academic year. Set up periods first.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border bg-muted px-3 py-2 text-left font-medium text-muted-foreground w-32">
              Period
            </th>
            {WEEKDAYS.map((d) => (
              <th
                key={d.key}
                className="border bg-muted px-3 py-2 text-center font-medium text-muted-foreground"
              >
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((period) => (
            <tr key={period.id}>
              <td className="border bg-muted/40 px-3 py-2">
                <p className="font-medium">{period.name}</p>
                <p className="text-xs text-muted-foreground">
                  {period.start_time.slice(0, 5)}–{period.end_time.slice(0, 5)}
                </p>
              </td>
              {WEEKDAYS.map((day) => {
                const slot = slotMap.get(`${period.id}:${day.key}`);
                return (
                  <td key={day.key} className="border px-2 py-1 align-top min-w-[120px]">
                    {slot ? (
                      <button
                        type="button"
                        onClick={() => setEditSlot(slot)}
                        className={`w-full rounded p-1 text-left hover:bg-accent transition-colors ${
                          slot.status === "SUBSTITUTED"
                            ? "opacity-60 ring-1 ring-yellow-400"
                            : ""
                        }`}
                        title={slot.status === "SUBSTITUTED" ? "Substituted" : undefined}
                      >
                        <p className="font-medium truncate">{slot.subject_name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {slot.teacher_name ?? "—"}
                        </p>
                        {slot.status === "SUBSTITUTED" && (
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            Substituted
                          </p>
                        )}
                      </button>
                    ) : (
                      <PermissionGate permission={PERMISSIONS.timetables.slot.create}>
                        <button
                          type="button"
                          onClick={() => setCreateCell({ day: day.key, periodId: period.id })}
                          className="flex items-center justify-center w-full h-10 rounded border-dashed border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          aria-label={`Add slot for ${period.name} on ${day.label}`}
                        >
                          <Plus className="size-4" />
                        </button>
                      </PermissionGate>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {createCell && (
        <SlotFormDialog
          open={!!createCell}
          onOpenChange={(open) => {
            if (!open) setCreateCell(null);
          }}
          cohortId={cohortId}
          academicYearId={academicYearId}
          periods={periods}
          subjects={subjects}
          prefillDay={createCell.day}
          prefillPeriodId={createCell.periodId}
        />
      )}

      {editSlot && (
        <SlotFormDialog
          open={!!editSlot}
          onOpenChange={(open) => {
            if (!open) setEditSlot(null);
          }}
          cohortId={cohortId}
          academicYearId={academicYearId}
          periods={periods}
          subjects={subjects}
          slot={editSlot}
        />
      )}

      <ConfirmDialog
        open={!!cancelSlot}
        onOpenChange={(open) => {
          if (!open) setCancelSlot(null);
        }}
        title="Cancel timetable slot"
        description="This will cancel the slot. The record will be kept for audit purposes."
        confirmLabel="Cancel slot"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
