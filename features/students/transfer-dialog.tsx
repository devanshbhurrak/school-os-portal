"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { transferEnrollment, listCohorts } from "@/services";
import type { Enrollment } from "@/types/student";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { showMutationError } from "@/lib/error-messages";
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

const transferSchema = z.object({
  new_cohort_id: z.string().min(1, "New section is required"),
  new_academic_class_id: z.string().min(1, "New class is required"),
  effective_date: z.string().min(1, "Effective date is required"),
  reason: z.string().max(500).optional(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enrollment: Enrollment;
  onTransferred?: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  enrollment,
  onTransferred,
}: TransferDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      new_cohort_id: "",
      new_academic_class_id: "",
      effective_date: "",
      reason: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      new_cohort_id: "",
      new_academic_class_id: "",
      effective_date: "",
      reason: "",
    });
  }, [open, reset]);

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { academic_year_id: enrollment.academic_year_id }),
    queryFn: () => listCohorts({ academic_year_id: enrollment.academic_year_id }),
    enabled: open && !!schoolId,
    staleTime: STALE_TIME.config,
  });

  const watchedCohortId = watch("new_cohort_id");

  // Derive academic_class_id from selected cohort
  const selectedCohort = cohortsQuery.data?.items?.find((c) => c.id === watchedCohortId);

  const transferMutation = useMutation({
    mutationFn: (values: TransferFormValues) =>
      transferEnrollment(enrollment.id, {
        new_cohort_id: values.new_cohort_id,
        new_academic_class_id: values.new_academic_class_id,
        effective_date: values.effective_date,
        reason: values.reason || undefined,
        version: enrollment.version,
      }),
    onSuccess: (newEnrollment) => {
      toast.success("Student transferred successfully");
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.enrollments(schoolId, {}),
      });
      onTransferred?.();
      onOpenChange(false);
    },
    onError: (error) => {
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    // Auto-fill academic_class_id from selected cohort if available
    const classId = selectedCohort?.academic_class_id ?? values.new_academic_class_id;
    await transferMutation.mutateAsync({ ...values, new_academic_class_id: classId });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Student</DialogTitle>
          <DialogDescription>
            Move this student to a different section or class within the same academic year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Controller
            control={control}
            name="new_cohort_id"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="new_cohort_id">New Section *</Label>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const cohort = cohortsQuery.data?.items?.find((c) => c.id === value);
                    if (cohort) {
                      // Sync class id via watch + setValue not needed — handled in onSubmit
                    }
                  }}
                >
                  <SelectTrigger id="new_cohort_id" className="w-full">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cohortsQuery.data?.items ?? [])
                      .filter((c) => c.id !== enrollment.cohort_id)
                      .map((cohort) => (
                        <SelectItem key={cohort.id} value={cohort.id}>
                          {cohort.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.new_cohort_id ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.new_cohort_id.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="effective_date">Effective Date *</Label>
            <Input
              id="effective_date"
              type="date"
              aria-invalid={!!errors.effective_date}
              {...register("effective_date")}
            />
            {errors.effective_date ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.effective_date.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Reason for transfer…"
              rows={3}
              {...register("reason")}
            />
            {errors.reason ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.reason.message}
              </p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
