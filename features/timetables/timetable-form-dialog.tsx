"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createTimetable } from "@/services";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys } from "@/lib/query-keys";
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

const timetableSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or fewer"),
});

type TimetableFormValues = z.infer<typeof timetableSchema>;

interface TimetableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  academicYearId: string;
  onCreated?: (id: string) => void;
}

export function TimetableFormDialog({
  open,
  onOpenChange,
  academicYearId,
  onCreated,
}: TimetableFormDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TimetableFormValues>({
    resolver: zodResolver(timetableSchema),
    defaultValues: { name: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: TimetableFormValues) =>
      createTimetable({ academic_year_id: academicYearId, name: values.name }),
    onSuccess: (tt) => {
      toast.success(`Timetable "${tt.name}" created`);
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.timetables(schoolId, { academic_year_id: academicYearId }),
      });
      reset();
      onOpenChange(false);
      onCreated?.(tt.id);
    },
    onError: (e: unknown) => showMutationError(e),
  });

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Timetable</DialogTitle>
          <DialogDescription>
            Create a new draft timetable for the active academic year.
          </DialogDescription>
        </DialogHeader>

        <form
          id="timetable-form"
          onSubmit={handleSubmit((v) => mutation.mutateAsync(v))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="tt-name">Name</Label>
            <Input
              id="tt-name"
              placeholder="e.g. Term 1 Timetable"
              maxLength={200}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="timetable-form" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
