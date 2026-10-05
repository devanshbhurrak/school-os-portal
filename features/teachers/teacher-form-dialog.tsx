"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTeacher, getTeacher, listPersons, updateTeacher } from "@/services";
import type { Person, Teacher } from "@/types";
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

const teacherSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  employee_number: z.string().max(50).optional().or(z.literal("")),
  designation: z.string().max(100).optional().or(z.literal("")),
  joining_date: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED", "INACTIVE"]),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

function toFormValues(teacher: Teacher): TeacherFormValues {
  return {
    person_id: teacher.person_id,
    employee_number: teacher.employee_number ?? "",
    designation: teacher.designation ?? "",
    joining_date: teacher.joining_date ?? "",
    status: teacher.status,
  };
}

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher?: Teacher | null;
  onSaved?: (teacher: Teacher) => void;
}

export function TeacherFormDialog({
  open,
  onOpenChange,
  teacher,
  onSaved,
}: TeacherFormDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!teacher;
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);
  const [personSearch, setPersonSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      person_id: "",
      employee_number: "",
      designation: "",
      joining_date: "",
      status: "ACTIVE",
    },
  });

  const teacherQuery = useQuery({
    queryKey: schoolKeys.teacher(schoolId, teacher?.id ?? ""),
    queryFn: () => getTeacher(teacher!.id),
    enabled: isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const personsQuery = useQuery({
    queryKey: schoolKeys.persons(schoolId, { search: personSearch }),
    queryFn: () => listPersons({ search: personSearch || undefined }),
    enabled: !isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && teacherQuery.data) {
      reset(toFormValues(teacherQuery.data));
    }
    if (!isEditing) {
      reset({
        person_id: "",
        employee_number: "",
        designation: "",
        joining_date: "",
        status: "ACTIVE",
      });
      setPersonSearch("");
    }
  }, [open, isEditing, teacherQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: TeacherFormValues) => {
      const emptyToNull = (v?: string) => (v && v.trim() ? v.trim() : null);
      if (isEditing && teacher) {
        const version = teacherQuery.data?.version ?? teacher.version;
        return updateTeacher(teacher.id, {
          employee_number: emptyToNull(values.employee_number),
          designation: emptyToNull(values.designation),
          joining_date: emptyToNull(values.joining_date),
          status: values.status,
          version,
        });
      }
      return createTeacher({
        person_id: values.person_id,
        employee_number: emptyToNull(values.employee_number),
        designation: emptyToNull(values.designation),
        joining_date: emptyToNull(values.joining_date),
        status: values.status,
      });
    },
    onSuccess: (saved) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.teachers(schoolId) });
        void queryClient.invalidateQueries({
          queryKey: schoolKeys.teacher(schoolId, saved.id),
        });
      }
      toast.success(isEditing ? "Teacher updated" : "Teacher added");
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
      const fresh = await getTeacher(teacher!.id);
      queryClient.setQueryData(schoolKeys.teacher(schoolId, fresh.id), fresh);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const loading = isEditing && open && teacherQuery.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit teacher" : "Add teacher"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update teacher details. Changes are saved immediately."
                : "Register a person as a teacher."}
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

              <FormSection title="Employment details" bare>
                <div className="space-y-1.5">
                  <Label htmlFor="employee_number">Employee number</Label>
                  <Input
                    id="employee_number"
                    placeholder="e.g. EMP-001"
                    {...register("employee_number")}
                  />
                  {errors.employee_number ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.employee_number.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Senior Science Teacher"
                    {...register("designation")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="joining_date">Joining date</Label>
                  <Input
                    id="joining_date"
                    type="date"
                    {...register("joining_date")}
                  />
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
                          <SelectItem value="ON_LEAVE">On leave</SelectItem>
                          <SelectItem value="RESIGNED">Resigned</SelectItem>
                          <SelectItem value="TERMINATED">Terminated</SelectItem>
                          <SelectItem value="INACTIVE">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </FormSection>

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
                  {isEditing ? "Save changes" : "Add teacher"}
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
        loading={teacherQuery.isFetching}
      />
    </>
  );
}
