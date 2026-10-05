"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus } from "lucide-react";
import { toast } from "sonner";
import { listTimetables, publishTimetable, archiveTimetable } from "@/services";
import type { ConflictItem, Timetable, TimetableStatus } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { TimetableFormDialog } from "./timetable-form-dialog";
import { ConflictDialog } from "./conflict-dialog";

function statusBadgeVariant(status: TimetableStatus) {
  switch (status) {
    case "DRAFT":
      return "secondary" as const;
    case "PUBLISHED":
      return "default" as const;
    case "ARCHIVED":
      return "outline" as const;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface TimetableListProps {
  academicYearId: string;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TimetableList({ academicYearId, selectedId, onSelect }: TimetableListProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [archivingTimetable, setArchivingTimetable] = useState<Timetable | null>(null);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);

  const { data: page, isLoading } = useQuery({
    queryKey: schoolKeys.timetables(schoolId, { academic_year_id: academicYearId }),
    queryFn: () => listTimetables({ academic_year_id: academicYearId }),
    enabled: !!schoolId && !!academicYearId,
    staleTime: STALE_TIME.entity,
  });
  const timetables = page?.items ?? [];

  function invalidate() {
    void queryClient.invalidateQueries({
      queryKey: schoolKeys.timetables(schoolId, { academic_year_id: academicYearId }),
    });
  }

  const publishMutation = useMutation({
    mutationFn: (tt: Timetable) => publishTimetable(tt.id, tt.version),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Timetable published");
        invalidate();
      } else {
        setConflicts(result.conflicts);
        setConflictsOpen(true);
      }
    },
    onError: (e: unknown) => showMutationError(e),
  });

  const archiveMutation = useMutation({
    mutationFn: (tt: Timetable) => archiveTimetable(tt.id, tt.version),
    onSuccess: () => {
      toast.success("Timetable archived");
      setArchivingTimetable(null);
      invalidate();
    },
    onError: (e: unknown) => showMutationError(e),
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PermissionGate permission={PERMISSIONS.timetables.timetable.create}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Timetable
          </Button>
        </PermissionGate>
      </div>

      {timetables.length === 0 ? (
        <EmptyState
          icon={CalendarRange}
          title="No timetables"
          description="Create a timetable to start scheduling slots for this academic year."
          compact
        />
      ) : (
        <div className="rounded-lg border divide-y">
          {timetables.map((tt) => {
            const isSelected = tt.id === selectedId;
            return (
              <div
                key={tt.id}
                className={`flex items-center gap-4 px-4 py-3 ${isSelected ? "bg-muted/50" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{tt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Created {formatDate(tt.created_at)}
                  </p>
                </div>

                <Badge variant={statusBadgeVariant(tt.status)}>{tt.status}</Badge>

                <div className="flex items-center gap-2">
                  <Button
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onSelect(tt.id)}
                  >
                    {isSelected ? "Selected" : "View Grid"}
                  </Button>

                  {tt.status === "DRAFT" && (
                    <PermissionGate permission={PERMISSIONS.timetables.timetable.update}>
                      <Button
                        size="sm"
                        onClick={() => publishMutation.mutate(tt)}
                        disabled={publishMutation.isPending}
                      >
                        {publishMutation.isPending && publishMutation.variables?.id === tt.id
                          ? "Publishing..."
                          : "Publish"}
                      </Button>
                    </PermissionGate>
                  )}

                  {tt.status !== "ARCHIVED" && (
                    <PermissionGate permission={PERMISSIONS.timetables.timetable.update}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setArchivingTimetable(tt)}
                      >
                        Archive
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TimetableFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        academicYearId={academicYearId}
        onCreated={(id) => onSelect(id)}
      />

      <ConfirmDialog
        open={!!archivingTimetable}
        onOpenChange={(open) => {
          if (!open) setArchivingTimetable(null);
        }}
        title="Archive timetable"
        description={
          archivingTimetable ? (
            <>
              Archive <span className="font-medium">{archivingTimetable.name}</span>? Archived
              timetables cannot be edited or published again.
            </>
          ) : undefined
        }
        confirmLabel="Archive"
        onConfirm={async () => {
          if (archivingTimetable) {
            await archiveMutation.mutateAsync(archivingTimetable);
          }
        }}
      />

      <ConflictDialog
        open={conflictsOpen}
        onOpenChange={setConflictsOpen}
        conflicts={conflicts}
      />
    </div>
  );
}
