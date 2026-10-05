"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Announcement, AnnouncementPriority, AnnouncementStatus } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { STATUS_LABELS } from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { formatDate } from "@/lib/format";
import {
  archiveAnnouncement,
  listAnnouncements,
  publishAnnouncement,
} from "@/services/announcements";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PermissionGate } from "@/components/ui/permission-gate";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Megaphone, MoreHorizontal, Pencil, Plus, Send, Archive } from "lucide-react";
import { AnnouncementFormDialog } from "./announcement-form-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS: (AnnouncementStatus | "ALL")[] = ["ALL", "DRAFT", "PUBLISHED", "EXPIRED", "ARCHIVED"];
const PRIORITY_FILTERS: (AnnouncementPriority | "ALL")[] = ["ALL", "NORMAL", "HIGH", "URGENT"];

const PRIORITY_LABELS: Record<AnnouncementPriority, string> = {
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const PRIORITY_BADGE_CLASSES: Record<AnnouncementPriority, string> = {
  NORMAL: "bg-muted text-muted-foreground",
  HIGH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function targetSummary(announcement: Announcement): string {
  if (!announcement.targets || announcement.targets.length === 0) return "Whole school";
  const schoolTarget = announcement.targets.find((t) => t.target_type === "SCHOOL");
  if (schoolTarget) return "Whole school";
  const types = [...new Set(announcement.targets.map((t) => t.target_type))];
  return types.map((t) => `${t.charAt(0)}${t.slice(1).toLowerCase()}`).join(", ");
}

export function AnnouncementList({ initialNew = false }: { initialNew?: boolean }) {
  const { activeSchool } = useSchoolContext();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(initialNew);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const pagination = useCursorPagination<Announcement>({
    queryKey: schoolKeys.announcements(schoolId, {
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
    }),
    queryFn: (params) =>
      listAnnouncements({
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
        ...params,
      }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  async function handlePublish(announcement: Announcement) {
    try {
      await publishAnnouncement(announcement.id, { version: announcement.version });
      toast.success("Announcement published");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  async function handleArchive(announcement: Announcement) {
    try {
      await archiveAnnouncement(announcement.id, announcement.version);
      toast.success("Announcement archived");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.announcements(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.announcement.create);
  const canPublish = hasPermission(PERMISSIONS.announcement.publish);
  const canArchive = hasPermission(PERMISSIONS.announcement.archive);
  const canUpdate = hasPermission(PERMISSIONS.announcement.update);

  const columns = useMemo<ColumnDef<DataTableFeatures, Announcement, unknown>[]>(
    () => [
      {
        id: "title",
        accessorFn: (a) => a.title,
        header: "Title",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.title}</p>
          </div>
        ),
      },
      {
        id: "priority",
        accessorFn: (a) => a.priority,
        header: "Priority",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[row.original.priority]}`}
          >
            {PRIORITY_LABELS[row.original.priority]}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (a) => a.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "targets",
        header: "Target",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{targetSummary(row.original)}</span>
        ),
      },
      {
        id: "published_at",
        accessorFn: (a) => a.published_at ?? "",
        header: "Published",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.published_at ? formatDate(row.original.published_at) : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open actions menu">
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate && (
                  <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                )}
                {canPublish && row.original.status === "DRAFT" && (
                  <DropdownMenuItem onSelect={() => handlePublish(row.original)}>
                    <Send className="size-4" /> Publish
                  </DropdownMenuItem>
                )}
                {canArchive && (row.original.status === "PUBLISHED" || row.original.status === "EXPIRED") && (
                  <DropdownMenuItem onSelect={() => handleArchive(row.original)}>
                    <Archive className="size-4" /> Archive
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [canUpdate, canPublish, canArchive],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AnnouncementStatus | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : STATUS_LABELS[s] ?? s}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as AnnouncementPriority | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by priority"
          >
            {PRIORITY_FILTERS.map((p) => (
              <option key={p} value={p}>
                {p === "ALL" ? "All priorities" : PRIORITY_LABELS[p as AnnouncementPriority] ?? p}
              </option>
            ))}
          </select>
        </div>
        <PermissionGate permission={PERMISSIONS.announcement.create}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New announcement
          </Button>
        </PermissionGate>
      </div>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<Announcement>
          columns={columns}
          data={pagination.items}
          rowKey={(a) => a.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={(a) => router.push(`/announcements/${a.id}`)}
          emptyState={
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Create your first announcement to reach your school community."
              action={
                canCreate ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    New announcement
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(a) => (
            <button
              type="button"
              onClick={() => router.push(`/announcements/${a.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.title}</p>
                <p className="truncate text-sm text-muted-foreground">{targetSummary(a)}</p>
              </div>
              <StatusBadge status={a.status} />
            </button>
          )}
        />
      )}

      {canCreate && (
        <AnnouncementFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {editing && (
        <AnnouncementFormDialog
          open={!!editing}
          onOpenChange={(open) => { if (!open) setEditing(null); }}
          announcement={editing}
        />
      )}
    </div>
  );
}
