"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createStudent, getStudent, listPersons, updateStudent } from "@/services";
import type { Person, Student } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
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
import { Skeleton } from "@/components/ui/skeleton";
import { FormSection } from "@/components/patterns/form-section";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";

const studentSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  admission_number: z.string().min(1, "Admission number is required").max(50),
  admission_date: z.string().min(1, "Admission date is required"),
  status: z.enum(["ACTIVE", "WITHDRAWN", "GRADUATED", "TRANSFERRED", "INACTIVE", "DECEASED"]),
  withdrawal_date: z.string().optional(),
  withdrawal_reason: z.string().max(500).optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

function toFormValues(student: Student): StudentFormValues {
  return {
    person_id: student.person_id,
    admission_number: student.admission_number,
    admission_date: student.admission_date,
    status: student.status,
    withdrawal_date: student.withdrawal_date ?? "",
    withdrawal_reason: student.withdrawal_reason ?? "",
  };
}

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSaved?: (student: Student) => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSaved,
}: StudentFormDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!student;
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      person_id: "",
      admission_number: "",
      admission_date: "",
      status: "ACTIVE",
      withdrawal_date: "",
      withdrawal_reason: "",
    },
  });

  const watchedStatus = watch("status");

  // Load freshest record when editing
  const studentQuery = useQuery({
    queryKey: schoolKeys.student(schoolId, student?.id ?? ""),
    queryFn: () => getStudent(student!.id),
    enabled: isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  // Person search for create mode
  const personsQuery = useQuery({
    queryKey: schoolKeys.persons(schoolId, { search: personSearch }),
    queryFn: () => listPersons({ search: personSearch || undefined }),
    enabled: !isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && studentQuery.data) {
      reset(toFormValues(studentQuery.data));
    }
    if (!isEditing) {
      reset({
        person_id: "",
        admission_number: "",
        admission_date: "",
        status: "ACTIVE",
        withdrawal_date: "",
        withdrawal_reason: "",
      });
    }
  }, [open, isEditing, studentQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: StudentFormValues) => {
      if (isEditing && student) {
        const version = studentQuery.data?.version ?? student.version;
        return updateStudent(student.id, {
          admission_number: values.admission_number,
          admission_date: values.admission_date,
          status: values.status,
          withdrawal_date: values.withdrawal_date || null,
          withdrawal_reason: values.withdrawal_reason || null,
          version,
        });
      }
      return createStudent({
        person_id: values.person_id,
        admission_number: values.admission_number,
        admission_date: values.admission_date,
        status: values.status,
      });
    },
    onSuccess: (saved) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.students(schoolId) });
        void queryClient.invalidateQueries({
          queryKey: schoolKeys.student(schoolId, saved.id),
        });
      }
      toast.success(isEditing ? "Student updated" : "Student added");
      onOpenChange(false);
      onSaved?.(saved);
    },
    onError: (error) => {
      if (isStaleResourceError(error)) {
        setStaleOpen(true);
        return;
      }
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values);
  });

  async function reloadFresh() {
    try {
      const fresh = await getStudent(student!.id);
      queryClient.setQueryData(schoolKeys.student(schoolId, fresh.id), fresh);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const loading = isEditing && open && studentQuery.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit student" : "Add student"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update student details. Changes are saved immediately."
                : "Enroll a person as a student."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              {!isEditing && (
                <FormSection title="Person" bare>
                  <div className="space-y-1.5">
                    <Label htmlFor="person_search">Search person</Label>
                    <Input
                      id="person_search"
                      placeholder="Type to search…"
                      value={personSearch}
                      onChange={(e) => setPersonSearch(e.target.value)}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="person_id"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <Label htmlFor="person_id">Person *</Label>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="person_id" className="w-full">
                            <SelectValue placeholder="Select a person" />
                          </SelectTrigger>
                          <SelectContent>
                            {(personsQuery.data?.items ?? []).map((p: Person) => (
                              <SelectItem key={p.id} value={p.id}>
                                {[p.first_name, p.last_name].filter(Boolean).join(" ")}
                                {p.primary_email ? ` — ${p.primary_email}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.person_id ? (
                          <p className="text-xs text-destructive" role="alert">
                            {errors.person_id.message}
                          </p>
                        ) : null}
                      </div>
                    )}
                  />
                </FormSection>
              )}

              <FormSection title="Enrollment details" bare>
                <div className="space-y-1.5">
                  <Label htmlFor="admission_number">Admission number *</Label>
                  <Input
                    id="admission_number"
                    aria-invalid={!!errors.admission_number}
                    {...register("admission_number")}
                  />
                  {errors.admission_number ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.admission_number.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admission_date">Admission date *</Label>
                  <Input
                    id="admission_date"
                    type="date"
                    aria-invalid={!!errors.admission_date}
                    {...register("admission_date")}
                  />
                  {errors.admission_date ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.admission_date.message}
                    </p>
                  ) : null}
                </div>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="status">Status</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
                          <SelectItem value="GRADUATED">Graduated</SelectItem>
                          <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                          <SelectItem value="DECEASED">Deceased</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </FormSection>

              {watchedStatus === "WITHDRAWN" && (
                <FormSection title="Withdrawal details" bare>
                  <div className="space-y-1.5">
                    <Label htmlFor="withdrawal_date">Withdrawal date</Label>
                    <Input
                      id="withdrawal_date"
                      type="date"
                      {...register("withdrawal_date")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="withdrawal_reason">Withdrawal reason</Label>
                    <Input
                      id="withdrawal_reason"
                      {...register("withdrawal_reason")}
                    />
                  </div>
                </FormSection>
              )}

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
                  {isEditing ? "Save changes" : "Add student"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={reloadFresh}
        onDismiss={() => {
          setStaleOpen(false);
          onOpenChange(false);
        }}
        loading={studentQuery.isFetching}
      />
    </>
  );
}
