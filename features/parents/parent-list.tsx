"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteParent, listParents } from "@/services";
import type { ColumnDef } from "@tanstack/react-table";
import type { Parent, ParentStatus } from "@/types";
import { useSchoolContext } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { MoreHorizontal, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ParentFormDialog } from "./parent-form-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS: (ParentStatus | "ALL")[] = ["ALL", "ACTIVE", "INACTIVE"];

function parentDisplayName(parent: Parent): string {
  return [parent.first_name, parent.last_name].filter(Boolean).join(" ");
}

export function ParentList() {
  const { activeSchool } = useSchoolContext();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ParentStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Parent | null>(null);
  const [deleting, setDeleting] = useState<Parent | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const params = {
    search: debouncedQuery || undefined,
    status_filter: statusFilter !== "ALL" ? statusFilter : undefined,
  };

  const pagination = useCursorPagination<Parent>({
    queryKey: schoolKeys.parents(schoolId, params),
    queryFn: (p) => listParents({ ...params, ...p }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteParent(deleting.id, deleting.version);
      toast.success("Parent deleted", {
        description: `${parentDisplayName(deleting)} was removed.`,
      });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.parents(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.parent.create);

  const columns = useMemo<ColumnDef<DataTableFeatures, Parent, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (p) => parentDisplayName(p),
        header: "Name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{parentDisplayName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.primary_email ?? row.original.primary_phone ?? "No contact info"}
            </p>
          </div>
        ),
      },
      {
        id: "email",
        accessorFn: (p) => p.primary_email,
        header: "Email",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.primary_email ?? "—"}
          </span>
        ),
      },
      {
        id: "phone",
        accessorFn: (p) => p.primary_phone,
        header: "Phone",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.primary_phone ?? "—"}
          </span>
        ),
      },
      {
        id: "occupation",
        accessorFn: (p) => p.occupation,
        header: "Occupation",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.occupation ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (p) => p.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
                <PermissionGate permission={PERMISSIONS.parent.update}>
                  <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.parent.delete}>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleting(row.original)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </PermissionGate>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="pl-9"
            aria-label="Search parents"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ParentStatus | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <PermissionGate permission={PERMISSIONS.parent.create}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add parent
            </Button>
          </PermissionGate>
        </div>
      </div>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<Parent>
          columns={columns}
          data={pagination.items}
          rowKey={(parent) => parent.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={(parent) => router.push(`/parents/${parent.id}`)}
          emptyState={
            <EmptyState
              icon={Users}
              title={pagination.items.length ? "No matching parents" : "No parents yet"}
              description={
                pagination.items.length
                  ? "Try changing your filters or search terms."
                  : "Add your first parent to get started."
              }
              action={
                canCreate && !pagination.items.length ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    Add parent
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(parent) => (
            <button
              type="button"
              onClick={() => router.push(`/parents/${parent.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{parentDisplayName(parent)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {parent.primary_email ?? parent.primary_phone ?? "No contact info"}
                </p>
              </div>
              <StatusBadge status={parent.status} />
            </button>
          )}
        />
      )}

      {canCreate ? (
        <ParentFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      ) : null}

      {editing ? (
        <ParentFormDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          parent={editing}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete parent"
        description={
          deleting ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{parentDisplayName(deleting)}</span>.
              This action cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete parent"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
