"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createParent, getParent, listPersons, updateParent } from "@/services";
import type { Parent, Person } from "@/types";
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

const parentSchema = z.object({
  person_id: z.string().min(1, "Person is required"),
  occupation: z.string().max(200).optional(),
  workplace: z.string().max(200).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

type ParentFormValues = z.infer<typeof parentSchema>;

function toFormValues(parent: Parent): ParentFormValues {
  return {
    person_id: parent.person_id,
    occupation: parent.occupation ?? "",
    workplace: parent.workplace ?? "",
    status: parent.status,
  };
}

interface ParentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parent?: Parent | null;
  onSaved?: (parent: Parent) => void;
}

export function ParentFormDialog({
  open,
  onOpenChange,
  parent,
  onSaved,
}: ParentFormDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!parent;
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
  } = useForm<ParentFormValues>({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      person_id: "",
      occupation: "",
      workplace: "",
      status: "ACTIVE",
    },
  });

  // Load freshest record when editing
  const parentQuery = useQuery({
    queryKey: schoolKeys.parent(schoolId, parent?.id ?? ""),
    queryFn: () => getParent(parent!.id),
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
    if (isEditing && parentQuery.data) {
      reset(toFormValues(parentQuery.data));
    }
    if (!isEditing) {
      reset({
        person_id: "",
        occupation: "",
        workplace: "",
        status: "ACTIVE",
      });
    }
  }, [open, isEditing, parentQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ParentFormValues) => {
      if (isEditing && parent) {
        const version = parentQuery.data?.version ?? parent.version;
        return updateParent(parent.id, {
          occupation: values.occupation || null,
          workplace: values.workplace || null,
          status: values.status,
          version,
        });
      }
      return createParent({
        person_id: values.person_id,
        occupation: values.occupation || null,
        workplace: values.workplace || null,
      });
    },
    onSuccess: (saved) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.parents(schoolId) });
        void queryClient.invalidateQueries({
          queryKey: schoolKeys.parent(schoolId, saved.id),
        });
      }
      toast.success(isEditing ? "Parent updated" : "Parent added");
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
      const fresh = await getParent(parent!.id);
      queryClient.setQueryData(schoolKeys.parent(schoolId, fresh.id), fresh);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const loading = isEditing && open && parentQuery.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit parent" : "Add parent"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update parent details. Changes are saved immediately."
                : "Register a person as a parent."}
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

              <FormSection title="Details" bare>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    aria-invalid={!!errors.occupation}
                    {...register("occupation")}
                  />
                  {errors.occupation ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.occupation.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workplace">Workplace</Label>
                  <Input
                    id="workplace"
                    aria-invalid={!!errors.workplace}
                    {...register("workplace")}
                  />
                  {errors.workplace ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.workplace.message}
                    </p>
                  ) : null}
                </div>
                {isEditing && (
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
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                )}
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
                  {isEditing ? "Save changes" : "Add parent"}
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
        loading={parentQuery.isFetching}
      />
    </>
  );
}
