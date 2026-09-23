"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addGuardian, updateGuardian, listPersons } from "@/services";
import type { Guardian, GuardianRelationship, Person } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
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
import { Switch } from "@/components/ui/switch";

const RELATIONSHIP_LABELS: Record<GuardianRelationship, string> = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
  GRANDPARENT: "Grandparent",
  SIBLING: "Sibling",
  OTHER: "Other",
};

const guardianSchema = z.object({
  guardian_person_id: z.string().min(1, "Guardian person is required"),
  relationship: z.enum(["FATHER", "MOTHER", "GUARDIAN", "GRANDPARENT", "SIBLING", "OTHER"]),
  is_primary: z.boolean(),
  is_emergency_contact: z.boolean(),
  can_pickup: z.boolean(),
});

type GuardianFormValues = z.infer<typeof guardianSchema>;

interface GuardianFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  guardian?: Guardian | null;
  onSaved?: (guardian: Guardian) => void;
}

export function GuardianFormDialog({
  open,
  onOpenChange,
  studentId,
  guardian,
  onSaved,
}: GuardianFormDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!guardian;
  const queryClient = useQueryClient();
  const [personSearch, setPersonSearch] = useState("");

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      guardian_person_id: "",
      relationship: "GUARDIAN",
      is_primary: false,
      is_emergency_contact: false,
      can_pickup: true,
    },
  });

  const personsQuery = useQuery({
    queryKey: schoolKeys.persons(schoolId, { search: personSearch }),
    queryFn: () => listPersons({ search: personSearch || undefined }),
    enabled: !isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && guardian) {
      reset({
        guardian_person_id: guardian.guardian_person_id,
        relationship: guardian.relationship,
        is_primary: guardian.is_primary,
        is_emergency_contact: guardian.is_emergency_contact,
        can_pickup: guardian.can_pickup,
      });
    } else {
      reset({
        guardian_person_id: "",
        relationship: "GUARDIAN",
        is_primary: false,
        is_emergency_contact: false,
        can_pickup: true,
      });
    }
  }, [open, isEditing, guardian, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: GuardianFormValues) => {
      if (isEditing && guardian) {
        return updateGuardian(schoolId, guardian.id, {
          relationship: values.relationship,
          is_primary: values.is_primary,
          is_emergency_contact: values.is_emergency_contact,
          can_pickup: values.can_pickup,
        });
      }
      return addGuardian(schoolId, {
        student_id: studentId,
        guardian_person_id: values.guardian_person_id,
        relationship: values.relationship,
        is_primary: values.is_primary,
        is_emergency_contact: values.is_emergency_contact,
        can_pickup: values.can_pickup,
      });
    },
    onSuccess: (saved) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.guardians(schoolId, studentId) });
        void queryClient.invalidateQueries({ queryKey: schoolKeys.guardian(schoolId, saved.id) });
      }
      toast.success(isEditing ? "Guardian updated" : "Guardian added");
      onOpenChange(false);
      onSaved?.(saved);
    },
    onError: (error) => {
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await saveMutation.mutateAsync(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit guardian" : "Add guardian"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update guardian relationship and settings."
              : "Link a person as a guardian for this student."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          {!isEditing && (
            <div className="space-y-3">
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
                name="guardian_person_id"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="guardian_person_id">Person *</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="guardian_person_id" className="w-full">
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
                    {errors.guardian_person_id && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.guardian_person_id.message}
                      </p>
                    )}
                  </div>
                )}
              />
            </div>
          )}

          {isEditing && guardian && (
            <div className="space-y-1.5">
              <Label>Person</Label>
              <p className="text-sm font-medium">
                {[guardian.guardian_first_name, guardian.guardian_last_name]
                  .filter(Boolean)
                  .join(" ") || guardian.guardian_person_id}
              </p>
            </div>
          )}

          <Controller
            control={control}
            name="relationship"
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="relationship">Relationship *</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="relationship" className="w-full">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELATIONSHIP_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <div className="space-y-4">
            <Controller
              control={control}
              name="is_primary"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_primary">Primary guardian</Label>
                  <Switch
                    id="is_primary"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="is_emergency_contact"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_emergency_contact">Emergency contact</Label>
                  <Switch
                    id="is_emergency_contact"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
            <Controller
              control={control}
              name="can_pickup"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_pickup">Can pick up</Label>
                  <Switch
                    id="can_pickup"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
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
              {isEditing ? "Save changes" : "Add guardian"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
