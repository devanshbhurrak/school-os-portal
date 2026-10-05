"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  archiveAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  publishAnnouncement,
} from "@/services/announcements";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import type { AnnouncementPriority } from "@/types";

const PRIORITY_BADGE_CLASSES: Record<AnnouncementPriority, string> = {
  NORMAL: "bg-muted text-muted-foreground",
  HIGH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

export function AnnouncementDetail({ announcementId }: { announcementId: string }) {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: announcement, isPending, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.announcement(schoolId, announcementId),
    queryFn: () => getAnnouncement(announcementId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.entity,
  });

  async function handlePublish() {
    if (!announcement) return;
    try {
      await publishAnnouncement(announcement.id, { version: announcement.version });
      toast.success("Announcement published");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcement(schoolId, announcementId) });
    } catch (err) {
      showMutationError(err);
    }
  }

  async function handleArchive() {
    if (!announcement) return;
    try {
      await archiveAnnouncement(announcement.id, announcement.version);
      toast.success("Announcement archived");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcement(schoolId, announcementId) });
    } catch (err) {
      showMutationError(err);
    }
  }

  async function handleDelete() {
    if (!announcement) return;
    try {
      await deleteAnnouncement(announcement.id, announcement.version);
      toast.success("Announcement deleted");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
      router.push("/announcements");
    } catch (err) {
      showMutationError(err);
    }
  }

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{announcement.title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={announcement.status} />
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[announcement.priority]}`}
            >
              {PRIORITY_LABELS[announcement.priority]}
            </span>
            {announcement.published_at && (
              <span className="text-sm text-muted-foreground">
                Published {formatDate(announcement.published_at)}
              </span>
            )}
            {announcement.expires_at && (
              <span className="text-sm text-muted-foreground">
                · Expires {formatDate(announcement.expires_at)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PermissionGate permission={PERMISSIONS.announcement.update}>
            {announcement.status === "DRAFT" && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.announcement.publish}>
            {announcement.status === "DRAFT" && (
              <Button size="sm" onClick={() => void handlePublish()}>
                <Send className="size-4" />
                Publish
              </Button>
            )}
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.announcement.archive}>
            {announcement.status === "PUBLISHED" && (
              <Button variant="outline" size="sm" onClick={() => void handleArchive()}>
                <Archive className="size-4" />
                Archive
              </Button>
            )}
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.announcement.delete}>
            {announcement.status === "DRAFT" && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </PermissionGate>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{announcement.body}</p>
      </div>

      {announcement.targets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Audience</h3>
          <div className="flex flex-wrap gap-2">
            {announcement.targets.map((t) => (
              <span
                key={t.id}
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
              >
                {t.target_type.charAt(0) + t.target_type.slice(1).toLowerCase()}
                {t.target_id ? ` · ${t.target_id}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <AnnouncementFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        announcement={announcement}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete announcement"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{announcement.title}</span>. This action cannot be
            undone.
          </>
        }
        confirmLabel="Delete announcement"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
