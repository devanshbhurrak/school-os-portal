"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createTimetableSlot,
  updateTimetableSlot,
  listPeriodDefinitions,
  listTeachers,
} from "@/services";
import type { PeriodDefinition, TimetableSlot } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { mapFieldErrors, showMutationError, isStaleResourceError } from "@/lib/error-messages";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/types";

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
] as const;

const slotSchema = z.object({
  cohort_id: z.string().min(1, "Cohort is required"),
  period_definition_id: z.string().min(1, "Period is required"),
  teacher_id: z.string().min(1, "Teacher is required"),
  subject_id: z.string().min(1, "Subject is required"),
  day_of_week: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  effective_from: z.string().min(1, "Effective from is required"),
  effective_to: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type SlotFormValues = z.infer<typeof slotSchema>;

interface SlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohortId: string;
  academicYearId: string;
  periods: PeriodDefinition[];
  subjects: { id: string; name: string }[];
  slot?: TimetableSlot | null;
  /** Pre-fill day and period when opening from grid cell */
  prefillDay?: string;
  prefillPeriodId?: string;
}

export function SlotFormDialog({
  open,
  onOpenChange,
  cohortId,
  academicYearId,
  periods,
  subjects,
  slot,
  prefillDay,
  prefillPeriodId,
}: SlotFormDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const isEdit = !!slot;

  const { data: teachersPage } = useQuery({
    queryKey: schoolKeys.teachers(schoolId),
    queryFn: () => listTeachers({ limit: 200 }),
    enabled: open && !!schoolId,
    staleTime: STALE_TIME.config,
  });
  const teachers = teachersPage?.items ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SlotFormValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: slot
      ? {
          cohort_id: slot.cohort_id,
          period_definition_id: slot.period_definition_id,
          teacher_id: slot.teacher_id,
          subject_id: slot.subject_id,
          day_of_week: slot.day_of_week,
          effective_from: slot.effective_from,
          effective_to: slot.effective_to ?? "",
          notes: slot.notes ?? "",
        }
      : {
          cohort_id: cohortId,
          period_definition_id: prefillPeriodId ?? "",
          teacher_id: "",
          subject_id: "",
          day_of_week: (prefillDay as SlotFormValues["day_of_week"]) ?? "MONDAY",
          effective_from: "",
          effective_to: "",
          notes: "",
        },
  });

  useEffect(() => {
    if (open) {
      reset(
        slot
          ? {
              cohort_id: slot.cohort_id,
              period_definition_id: slot.period_definition_id,
              teacher_id: slot.teacher_id,
              subject_id: slot.subject_id,
              day_of_week: slot.day_of_week,
              effective_from: slot.effective_from,
              effective_to: slot.effective_to ?? "",
              notes: slot.notes ?? "",
            }
          : {
              cohort_id: cohortId,
              period_definition_id: prefillPeriodId ?? "",
              teacher_id: "",
              subject_id: "",
              day_of_week: (prefillDay as SlotFormValues["day_of_week"]) ?? "MONDAY",
              effective_from: "",
              effective_to: "",
              notes: "",
            },
      );
    }
  }, [open, slot, cohortId, prefillDay, prefillPeriodId, reset]);

  const mutation = useMutation({
    mutationFn: async (values: SlotFormValues) => {
      if (isEdit && slot) {
        return updateTimetableSlot(slot.id, {
          teacher_id: values.teacher_id,
          subject_id: values.subject_id,
          effective_to: values.effective_to || undefined,
          notes: values.notes || null,
          version: slot.version,
        });
      }
      return createTimetableSlot({
        cohort_id: values.cohort_id,
        period_definition_id: values.period_definition_id,
        teacher_id: values.teacher_id,
        subject_id: values.subject_id,
        day_of_week: values.day_of_week,
        effective_from: values.effective_from,
        effective_to: values.effective_to || undefined,
        notes: values.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Timetable slot updated" : "Timetable slot created");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.timetableSlots(schoolId) });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        const code = error.code;
        if (code === "TEACHER_CONFLICT") {
          setError("teacher_id", { message: "This teacher already has a slot at this period and day." });
          return;
        }
        if (code === "COHORT_CONFLICT") {
          setError("period_definition_id", { message: "This cohort already has a slot at this period and day." });
          return;
        }
        if (isStaleResourceError(error)) {
          return; // handled by StaleResourceDialog
        }
        mapFieldErrors(error, setError);
      }
      showMutationError(error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit timetable slot" : "Add timetable slot"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the slot details." : "Assign a teacher and subject to a period."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="slot-form"
          onSubmit={handleSubmit((values) => mutation.mutateAsync(values))}
          className="space-y-4"
        >
          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="day_of_week">Day of week</Label>
                <Controller
                  name="day_of_week"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="day_of_week">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.day_of_week && (
                  <p className="text-sm text-destructive">{errors.day_of_week.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="period_definition_id">Period</Label>
                <Controller
                  name="period_definition_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="period_definition_id">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.start_time.slice(0, 5)}–{p.end_time.slice(0, 5)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.period_definition_id && (
                  <p className="text-sm text-destructive">{errors.period_definition_id.message}</p>
                )}
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="teacher_id">Teacher</Label>
            <Controller
              name="teacher_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="teacher_id">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {[t.person_first_name, t.person_last_name].filter(Boolean).join(" ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.teacher_id && (
              <p className="text-sm text-destructive">{errors.teacher_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subject_id">Subject</Label>
            <Controller
              name="subject_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="subject_id">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.subject_id && (
              <p className="text-sm text-destructive">{errors.subject_id.message}</p>
            )}
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="effective_from">Effective from</Label>
              <Input id="effective_from" type="date" {...register("effective_from")} />
              {errors.effective_from && (
                <p className="text-sm text-destructive">{errors.effective_from.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="effective_to">Effective to (optional)</Label>
            <Input id="effective_to" type="date" {...register("effective_to")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="slot-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create slot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
