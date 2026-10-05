"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPeriodDefinition,
  deletePeriodDefinition,
  listPeriodDefinitions,
  updatePeriodDefinition,
} from "@/services";
import type { PeriodDefinition } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { CalendarDays } from "lucide-react";

const PERIOD_TYPE_LABELS: Record<string, string> = {
  LESSON: "Lesson",
  BREAK: "Break",
  LUNCH: "Lunch",
  ASSEMBLY: "Assembly",
  FREE: "Free",
  EXAM: "Exam",
};

const PERIOD_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  LESSON: "default",
  BREAK: "secondary",
  LUNCH: "secondary",
  ASSEMBLY: "outline",
  FREE: "outline",
  EXAM: "default",
};

const periodSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  period_type: z.enum(["LESSON", "BREAK", "LUNCH", "ASSEMBLY", "FREE", "EXAM"]),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  sort_order: z.coerce.number().int().default(0),
});

type PeriodFormValues = z.output<typeof periodSchema>;

interface PeriodDefinitionListProps {
  academicYearId: string;
}

export function PeriodDefinitionList({ academicYearId }: PeriodDefinitionListProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PeriodDefinition | null>(null);
  const [deleting, setDeleting] = useState<PeriodDefinition | null>(null);

  const {
    data: page,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: schoolKeys.periodDefinitions(schoolId, academicYearId),
    queryFn: () => listPeriodDefinitions(academicYearId),
    enabled: !!schoolId && !!academicYearId,
    staleTime: STALE_TIME.config,
  });
  const periods = (page?.items ?? []).sort((a, b) => a.sort_order - b.sort_order);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PeriodFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(periodSchema) as any,
    defaultValues: { period_type: "LESSON", sort_order: 0 },
  });

  function openCreate() {
    reset({ period_type: "LESSON", sort_order: periods.length });
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(period: PeriodDefinition) {
    reset({
      name: period.name,
      period_type: period.period_type,
      start_time: period.start_time.slice(0, 5),
      end_time: period.end_time.slice(0, 5),
      sort_order: period.sort_order,
    });
    setEditing(period);
    setFormOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (values: PeriodFormValues) => {
      const payload = {
        ...values,
        start_time: values.start_time + ":00",
        end_time: values.end_time + ":00",
      };
      if (editing) {
        return updatePeriodDefinition(editing.id, { ...payload, version: editing.version });
      }
      return createPeriodDefinition({ ...payload, academic_year_id: academicYearId });
    },
    onSuccess: () => {
      toast.success(editing ? "Period updated" : "Period created");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.periodDefinitions(schoolId, academicYearId) });
      setFormOpen(false);
    },
    onError: (e: unknown) => showMutationError(e),
  });

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePeriodDefinition(deleting.id);
      toast.success("Period deleted");
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.periodDefinitions(schoolId, academicYearId) });
    } catch (err) {
      showMutationError(err);
    }
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <PermissionGate permission={PERMISSIONS.timetables.period.create}>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add period
          </Button>
        </PermissionGate>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No periods defined"
          description="Add period definitions to set up the daily schedule."
        />
      ) : (
        <div className="rounded-lg border divide-y">
          {periods.map((period) => (
            <div key={period.id} className="flex items-center gap-4 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{period.name}</p>
                <p className="text-sm text-muted-foreground">
                  {period.start_time.slice(0, 5)} – {period.end_time.slice(0, 5)}
                </p>
              </div>
              <Badge variant={PERIOD_TYPE_VARIANTS[period.period_type] ?? "outline"}>
                {PERIOD_TYPE_LABELS[period.period_type] ?? period.period_type}
              </Badge>
              <span className="text-sm text-muted-foreground w-8 text-right">#{period.sort_order}</span>
              <div className="flex gap-1">
                <PermissionGate permission={PERMISSIONS.timetables.period.update}>
                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(period)}>
                    <Pencil className="size-4" />
                  </Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.timetables.period.delete}>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(period)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </PermissionGate>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit period" : "Add period"}</DialogTitle>
            <DialogDescription>Define a time slot in the school day.</DialogDescription>
          </DialogHeader>
          <form
            id="period-form"
            onSubmit={handleSubmit((v) => saveMutation.mutateAsync(v as PeriodFormValues))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="e.g. Period 1" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="period_type">Type</Label>
              <Controller
                name="period_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="period_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERIOD_TYPE_LABELS).map(([v, label]) => (
                        <SelectItem key={v} value={v}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start_time">Start time</Label>
                <Input id="start_time" type="time" {...register("start_time")} />
                {errors.start_time && (
                  <p className="text-sm text-destructive">{errors.start_time.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end_time">End time</Label>
                <Input id="end_time" type="time" {...register("end_time")} />
                {errors.end_time && (
                  <p className="text-sm text-destructive">{errors.end_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sort_order">Order</Label>
              <Input id="sort_order" type="number" min={0} {...register("sort_order")} />
            </div>
          </form>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="period-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editing ? "Save changes" : "Add period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete period"
        description={
          deleting ? (
            <>
              Delete <span className="font-medium">{deleting.name}</span>? This cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
