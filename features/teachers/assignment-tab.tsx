"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  createAssignment,
  endAssignment,
  listAssignments,
  listAcademicYears,
  listCohorts,
  listSubjects,
} from "@/services";
import type { TeacherAssignment } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { ASSIGNMENT_ROLE_LABELS } from "@/lib/display";
import { showMutationError, mapFieldErrors } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { EmptyState } from "@/components/patterns/empty-state";
import { PermissionGate } from "@/components/ui/permission-gate";

const assignmentSchema = z.object({
  cohort_id: z.string().min(1, "Section is required"),
  subject_id: z.string().optional().or(z.literal("")),
  academic_year_id: z.string().min(1, "Academic year is required"),
  role: z.enum(["SUBJECT_TEACHER", "CLASS_TEACHER", "SUBSTITUTE", "COORDINATOR"]),
  start_date: z.string().min(1, "Start date is required"),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentTabProps {
  teacherId: string;
}

export function AssignmentTab({ teacherId }: AssignmentTabProps) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [ending, setEnding] = useState<TeacherAssignment | null>(null);

  const assignmentsQuery = useQuery({
    queryKey: schoolKeys.teacherAssignments(schoolId, { teacher_id: teacherId }),
    queryFn: () =>
      listAssignments({ teacher_id: teacherId, limit: 50 }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.teacherAssignment.list),
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  const yearsQuery = useQuery({
    queryKey: schoolKeys.years(schoolId),
    queryFn: () => listAcademicYears({ limit: 50 }),
    enabled: addOpen && !!schoolId,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(schoolId),
    queryFn: () => listCohorts({ limit: 100 }),
    enabled: addOpen && !!schoolId,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const subjectsQuery = useQuery({
    queryKey: schoolKeys.subjects(schoolId),
    queryFn: () => listSubjects({ limit: 100 }),
    enabled: addOpen && !!schoolId,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      cohort_id: "",
      subject_id: "",
      academic_year_id: "",
      role: "SUBJECT_TEACHER",
      start_date: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: AssignmentFormValues) =>
      createAssignment({
        teacher_id: teacherId,
        cohort_id: values.cohort_id,
        subject_id: values.subject_id || null,
        academic_year_id: values.academic_year_id,
        role: values.role,
        start_date: values.start_date,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.teacherAssignments(schoolId, { teacher_id: teacherId }),
      });
      toast.success("Assignment created");
      setAddOpen(false);
      reset();
    },
    onError: (error) => {
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const endMutation = useMutation({
    mutationFn: (assignment: TeacherAssignment) =>
      endAssignment(assignment.id, assignment.version),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.teacherAssignments(schoolId, { teacher_id: teacherId }),
      });
      toast.success("Assignment ended");
      setEnding(null);
    },
    onError: (error) => {
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(values);
  });

  const assignments = assignmentsQuery.data ?? [];
  const canCreate = hasPermission(PERMISSIONS.teacherAssignment.create);
  const canEnd = hasPermission(PERMISSIONS.teacherAssignment.delete);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Assignments</h3>
        <PermissionGate permission={PERMISSIONS.teacherAssignment.create}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              reset();
              setAddOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add assignment
          </Button>
        </PermissionGate>
      </div>

      {assignmentsQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          compact
          icon={Plus}
          title="No assignments"
          description={
            canCreate
              ? "Assign this teacher to a section."
              : "No assignments on record."
          }
          action={
            canCreate ? (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add assignment
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {assignments.map((assignment) => (
            <li key={assignment.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {assignment.cohort_name}
                  {assignment.subject_name ? ` — ${assignment.subject_name}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ASSIGNMENT_ROLE_LABELS[assignment.role] ?? assignment.role}
                  {" · "}{assignment.academic_year_code}
                  {" · "}{formatDate(assignment.start_date)}
                  {assignment.end_date ? ` → ${formatDate(assignment.end_date)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={assignment.status === "ACTIVE" ? "default" : "secondary"}>
                  {assignment.status === "ACTIVE" ? "Active" : "Ended"}
                </Badge>
                {assignment.status === "ACTIVE" && canEnd ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setEnding(assignment)}
                  >
                    End
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add assignment</DialogTitle>
            <DialogDescription>Assign this teacher to a section for an academic year.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Controller
              control={control}
              name="academic_year_id"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="academic_year_id">Academic year *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="academic_year_id" className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {(yearsQuery.data ?? []).map((y) => (
                        <SelectItem key={y.id} value={y.id}>
                          {y.name} ({y.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.academic_year_id ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.academic_year_id.message}
                    </p>
                  ) : null}
                </div>
              )}
            />
            <Controller
              control={control}
              name="cohort_id"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="cohort_id">Section *</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="cohort_id" className="w-full">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {(cohortsQuery.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="subject_id"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="subject_id">Subject</Label>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="subject_id" className="w-full">
                      <SelectValue placeholder="Select subject (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {(subjectsQuery.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUBJECT_TEACHER">Subject teacher</SelectItem>
                      <SelectItem value="CLASS_TEACHER">Class teacher</SelectItem>
                      <SelectItem value="SUBSTITUTE">Substitute</SelectItem>
                      <SelectItem value="COORDINATOR">Coordinator</SelectItem>
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
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Add assignment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(open) => {
          if (!open) setEnding(null);
        }}
        title="End assignment"
        description={
          ending
            ? `End the assignment for ${ending.cohort_name}${ending.subject_name ? ` — ${ending.subject_name}` : ""}? Today will be set as the end date.`
            : undefined
        }
        confirmLabel="End assignment"
        destructive
        onConfirm={() => { if (ending) endMutation.mutate(ending); }}
      />
    </div>
  );
}
