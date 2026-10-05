"use client";

import { useEffect, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/services/announcements";
import type { Announcement } from "@/types";
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
import { Textarea } from "@/components/ui/textarea";
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

const TARGET_TYPES = ["SCHOOL", "CLASS", "COHORT", "ROLE"] as const;

const announcementSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(500),
    body: z.string().min(1, "Body is required"),
    priority: z.enum(["NORMAL", "HIGH", "URGENT"]),
    publish_mode: z.enum(["IMMEDIATE", "SCHEDULED"]),
    scheduled_at: z.string().optional(),
    expires_at: z.string().optional(),
    targets: z.array(
      z.object({
        target_type: z.enum(["SCHOOL", "CLASS", "COHORT", "ROLE"]),
        target_id: z.string().optional(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.publish_mode === "SCHEDULED" && !data.scheduled_at) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A scheduled date and time is required.",
        path: ["scheduled_at"],
      });
    }
  });

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function toFormValues(a: Announcement): AnnouncementFormValues {
  return {
    title: a.title,
    body: a.body,
    priority: a.priority,
    publish_mode: a.publish_mode,
    scheduled_at: a.published_at && a.publish_mode === "SCHEDULED"
      ? new Date(a.published_at).toISOString().slice(0, 16)
      : "",
    expires_at: a.expires_at
      ? new Date(a.expires_at).toISOString().slice(0, 16)
      : "",
    targets: a.targets.map((t) => ({
      target_type: t.target_type,
      target_id: t.target_id ?? undefined,
    })),
  };
}

interface AnnouncementFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: Announcement | null;
  onSaved?: (announcement: Announcement) => void;
}

export function AnnouncementFormDialog({
  open,
  onOpenChange,
  announcement,
  onSaved,
}: AnnouncementFormDialogProps) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!announcement;
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      body: "",
      priority: "NORMAL",
      publish_mode: "IMMEDIATE",
      scheduled_at: "",
      expires_at: "",
      targets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "targets" });

  const publishMode = watch("publish_mode");

  const announcementQuery = useQuery({
    queryKey: schoolKeys.announcement(schoolId, announcement?.id ?? ""),
    queryFn: () => getAnnouncement(announcement!.id),
    enabled: isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (!open) return;
    if (isEditing && announcementQuery.data) {
      reset(toFormValues(announcementQuery.data));
    } else if (!isEditing) {
      reset({
        title: "",
        body: "",
        priority: "NORMAL",
        publish_mode: "IMMEDIATE",
        scheduled_at: "",
        expires_at: "",
        targets: [],
      });
    }
  }, [open, announcementQuery.data, isEditing, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: AnnouncementFormValues) => {
      const targets = values.targets.map((t) => ({
        target_type: t.target_type,
        target_id: t.target_id || undefined,
      }));
      const expires_at = values.expires_at
        ? new Date(values.expires_at).toISOString()
        : undefined;

      if (isEditing && announcement) {
        const version = announcementQuery.data?.version ?? announcement.version;
        return updateAnnouncement(announcement.id, {
          title: values.title,
          body: values.body,
          priority: values.priority,
          targets,
          expires_at: expires_at ?? null,
          version,
        });
      }

      const published_at =
        values.publish_mode === "SCHEDULED" && values.scheduled_at
          ? new Date(values.scheduled_at).toISOString()
          : undefined;

      return createAnnouncement({
        title: values.title,
        body: values.body,
        priority: values.priority,
        publish_mode: values.publish_mode,
        targets,
        expires_at,
        ...(published_at ? { published_at } : {}),
      });
    },
    onSuccess: (saved) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
        void queryClient.invalidateQueries({
          queryKey: schoolKeys.announcement(schoolId, saved.id),
        });
      }
      toast.success(isEditing ? "Announcement updated" : "Announcement created", {
        description: saved.title,
      });
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
      const fresh = await getAnnouncement(announcement!.id);
      queryClient.setQueryData(schoolKeys.announcement(schoolId, fresh.id), fresh);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const loading = isEditing && open && announcementQuery.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the announcement details."
                : "Create a new announcement for your school."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <FormSection title="Announcement details" bare>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    aria-invalid={!!errors.title}
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="body">Body *</Label>
                  <Textarea
                    id="body"
                    rows={5}
                    aria-invalid={!!errors.body}
                    {...register("body")}
                  />
                  {errors.body && (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.body.message}
                    </p>
                  )}
                </div>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="priority" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="publish_mode"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="publish_mode">Publish mode</Label>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="publish_mode" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                {publishMode === "SCHEDULED" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduled_at">Publish at *</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      aria-invalid={!!errors.scheduled_at}
                      {...register("scheduled_at")}
                    />
                    {errors.scheduled_at && (
                      <p className="text-xs text-destructive" role="alert">
                        {errors.scheduled_at.message}
                      </p>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="expires_at">Expires at (optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    {...register("expires_at")}
                  />
                </div>
              </FormSection>

              <FormSection title="Audience" description="Leave empty to target the whole school." bare>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Controller
                        control={control}
                        name={`targets.${index}.target_type`}
                        render={({ field: f }) => (
                          <Select value={f.value} onValueChange={f.onChange}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TARGET_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.charAt(0) + t.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <Input
                        placeholder="Target ID (optional)"
                        className="flex-1"
                        {...register(`targets.${index}.target_id`)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(index)}
                        aria-label="Remove target"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ target_type: "SCHOOL" })}
                  >
                    <Plus className="size-4" />
                    Add target
                  </Button>
                </div>
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
                  {isEditing ? "Save changes" : "Create announcement"}
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
        loading={announcementQuery.isFetching}
      />
    </>
  );
}
