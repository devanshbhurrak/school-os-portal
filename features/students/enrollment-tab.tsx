"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, ArrowRightLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { listEnrollments, createEnrollment, listCohorts } from "@/services";
import type { Enrollment } from "@/types/student";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { mapFieldErrors, showMutationError } from "@/lib/error-messages";
import { PermissionGate } from "@/components/ui/permission-gate";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransferDialog } from "./transfer-dialog";

const enrollSchema = z.object({
  academic_year_id: z.string().min(1, "Choose an academic year."),
  cohort_id: z.string().min(1, "Choose a section."),
  academic_class_id: z.string(),
  enrollment_type: z.enum(["REGULAR", "TRANSFER_IN", "REPEAT", "PROMOTION", "TEMPORARY"]),
  roll_number: z.string().max(40).optional(),
  start_date: z.string().min(1, "Start date is required."),
});

type EnrollFormValues = z.infer<typeof enrollSchema>;

const ENROLLMENT_TYPE_LABELS: Record<string, string> = {
  REGULAR: "Regular",
  TRANSFER_IN: "Transfer in",
  REPEAT: "Repeat",
  PROMOTION: "Promotion",
  TEMPORARY: "Temporary",
};

interface EnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  activeYearId: string;
  onEnrolled: () => void;
}

function EnrollDialog({
  open,
  onOpenChange,
  studentId,
  activeYearId,
  onEnrolled,
}: EnrollDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EnrollFormValues>({
    resolver: zodResolver(enrollSchema),
    defaultValues: {
      academic_year_id: activeYearId,
      cohort_id: "",
      academic_class_id: "",
      enrollment_type: "REGULAR",
      roll_number: "",
      start_date: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      academic_year_id: activeYearId,
      cohort_id: "",
      academic_class_id: "",
      enrollment_type: "REGULAR",
      roll_number: "",
      start_date: "",
    });
  }, [open, activeYearId, reset]);

  const watchedYearId = watch("academic_year_id");
  const watchedCohortId = watch("cohort_id");

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { academic_year_id: watchedYearId }),
    queryFn: () => listCohorts({ academic_year_id: watchedYearId }),
    enabled: open && !!schoolId && !!watchedYearId,
    staleTime: STALE_TIME.config,
  });

  // Auto-fill academic_class_id from selected cohort
  useEffect(() => {
    const cohort = cohortsQuery.data?.items?.find((c) => c.id === watchedCohortId);
    if (cohort) {
      setValue("academic_class_id", cohort.academic_class_id ?? "");
    }
  }, [watchedCohortId, cohortsQuery.data, setValue]);

  const mutation = useMutation({
    mutationFn: (values: EnrollFormValues) =>
      createEnrollment({
        student_id: studentId,
        academic_year_id: values.academic_year_id,
        academic_class_id: values.academic_class_id,
        cohort_id: values.cohort_id,
        enrollment_type: values.enrollment_type,
        roll_number: values.roll_number || undefined,
        start_date: values.start_date,
      }),
    onSuccess: () => {
      toast.success("Student enrolled successfully");
      onEnrolled();
      onOpenChange(false);
    },
    onError: (error) => {
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
          <DialogDescription>
            Add this student to a section for the selected academic year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Controller
            control={control}
            name="cohort_id"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="cohort_id">Section *</Label>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="cohort_id" className="w-full">
                    <SelectValue placeholder="Select a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cohortsQuery.data?.items ?? []).map((cohort) => (
                      <SelectItem key={cohort.id} value={cohort.id}>
                        {cohort.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cohort_id ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.cohort_id.message}
                  </p>
                ) : null}
              </div>
            )}
          />

          <Controller
            control={control}
            name="enrollment_type"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="enrollment_type">Enrollment type</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="enrollment_type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ENROLLMENT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="start_date">Start date *</Label>
            <Input
              id="start_date"
              type="date"
              aria-invalid={!!errors.start_date}
              {...register("start_date")}
            />
            {errors.start_date ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.start_date.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="roll_number">Roll number (optional)</Label>
            <Input
              id="roll_number"
              placeholder="e.g. 42"
              {...register("roll_number")}
            />
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
              Enroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EnrollmentTabProps {
  studentId: string;
}

export function EnrollmentTab({ studentId }: EnrollmentTabProps) {
  const { activeSchool, activeYear } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEnrollment, setTransferEnrollment] = useState<Enrollment | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: schoolKeys.enrollments(schoolId, { student_id: studentId }),
    queryFn: () => listEnrollments({ student_id: studentId }),
    enabled: !!schoolId && !!studentId,
    staleTime: STALE_TIME.entity,
  });

  const enrollments = data?.items ?? [];
  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE") ?? null;

  function handleTransferClick(enrollment: Enrollment) {
    setTransferEnrollment(enrollment);
    setTransferOpen(true);
  }

  function invalidateEnrollments() {
    void queryClient.invalidateQueries({
      queryKey: schoolKeys.enrollments(schoolId, { student_id: studentId }),
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Loading enrollment data…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-destructive">
          Failed to load enrollments.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current active enrollment */}
      {activeEnrollment ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Current Enrollment</CardTitle>
            <PermissionGate permission={PERMISSIONS.enrollment.transfer}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTransferClick(activeEnrollment)}
              >
                <ArrowRightLeft className="size-4" />
                Transfer
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Academic Year</p>
              <p className="text-sm font-medium">
                {activeEnrollment.academic_year_name ?? activeEnrollment.academic_year_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Section</p>
              <p className="text-sm font-medium">
                {activeEnrollment.cohort_name ?? activeEnrollment.cohort_id}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Roll Number</p>
              <p className="text-sm font-medium">{activeEnrollment.roll_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="text-sm font-medium">{formatDate(activeEnrollment.start_date)}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-sm text-muted-foreground">No active enrollment for this student.</p>
            <PermissionGate permission={PERMISSIONS.enrollment.create}>
              <Button variant="outline" size="sm" onClick={() => setEnrollOpen(true)}>
                <PlusCircle className="size-4" />
                Enroll
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      )}

      {/* Enrollment history */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.academic_year_name ?? enrollment.academic_year_id}
                    </TableCell>
                    <TableCell>{enrollment.cohort_name ?? enrollment.cohort_id}</TableCell>
                    <TableCell>{enrollment.roll_number ?? "—"}</TableCell>
                    <TableCell>
                      {ENROLLMENT_TYPE_LABELS[enrollment.enrollment_type] ??
                        enrollment.enrollment_type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell>{formatDate(enrollment.start_date)}</TableCell>
                    <TableCell>
                      {enrollment.end_date ? formatDate(enrollment.end_date) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <EnrollDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        studentId={studentId}
        activeYearId={activeYear?.id ?? ""}
        onEnrolled={invalidateEnrollments}
      />

      {transferEnrollment && (
        <TransferDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          enrollment={transferEnrollment}
          onTransferred={invalidateEnrollments}
        />
      )}
    </div>
  );
}
