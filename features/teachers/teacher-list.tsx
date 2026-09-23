"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteTeacher, listTeachers } from "@/services";
import type { ColumnDef } from "@tanstack/react-table";
import type { Teacher, TeacherStatus } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, initials } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { MoreHorizontal, Pencil, Plus, Search, Trash2, UserRoundPen } from "lucide-react";
import { PermissionGate } from "@/components/ui/permission-gate";
import { TeacherFormDialog } from "./teacher-form-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS: (TeacherStatus | "ALL")[] = [
  "ALL", "ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED", "INACTIVE",
];

function teacherDisplayName(teacher: Teacher): string {
  return [teacher.person_first_name, teacher.person_last_name].filter(Boolean).join(" ");
}

export function TeacherList({ initialNew = false }: { initialNew?: boolean }) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TeacherStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(initialNew);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const listParams = {
    search: debouncedQuery || undefined,
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  };

  const pagination = useCursorPagination<Teacher>({
    queryKey: schoolKeys.teachers(schoolId, listParams),
    queryFn: (params) => listTeachers({ ...listParams, ...params }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteTeacher(deleting.id, deleting.version);
      toast.success("Teacher deleted", {
        description: teacherDisplayName(deleting),
      });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.teachers(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.teacher.create);

  const columns = useMemo<ColumnDef<DataTableFeatures, Teacher, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (t) => teacherDisplayName(t),
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(teacherDisplayName(row.original))}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/teachers/${row.original.id}`}
                className="block truncate font-medium hover:underline"
              >
                {teacherDisplayName(row.original)}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.person_primary_email ?? "No email"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "designation",
        accessorFn: (t) => t.designation ?? "",
        header: "Designation",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.designation ?? "—"}
          </span>
        ),
      },
      {
        id: "employee_number",
        accessorFn: (t) => t.employee_number ?? "",
        header: "Employee #",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.employee_number ?? "—"}
          </span>
        ),
      },
      {
        id: "joining_date",
        accessorFn: (t) => t.joining_date ?? "",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.joining_date ? formatDate(row.original.joining_date) : "—"}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (t) => t.status,
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
                <PermissionGate permission={PERMISSIONS.teacher.update}>
                  <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.teacher.delete}>
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
            placeholder="Search by name or email…"
            className="pl-9"
            aria-label="Search teachers"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TeacherStatus | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : (STATUS_LABELS[s] ?? s)}
              </option>
            ))}
          </select>
          <PermissionGate permission={PERMISSIONS.teacher.create}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add teacher
            </Button>
          </PermissionGate>
        </div>
      </div>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<Teacher>
          columns={columns}
          data={pagination.items}
          rowKey={(t) => t.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={(t) => router.push(`/teachers/${t.id}`)}
          emptyState={
            <EmptyState
              icon={UserRoundPen}
              title={pagination.items.length ? "No matching teachers" : "No teachers yet"}
              description={
                pagination.items.length
                  ? "Try changing your filters or search terms."
                  : "Add your first teacher to get started."
              }
              action={
                canCreate && !pagination.items.length ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    Add teacher
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(teacher) => (
            <button
              type="button"
              onClick={() => router.push(`/teachers/${teacher.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left"
            >
              <Avatar className="size-10">
                <AvatarFallback className="text-sm">
                  {initials(teacherDisplayName(teacher))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{teacherDisplayName(teacher)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {teacher.designation ?? teacher.person_primary_email ?? "—"}
                </p>
              </div>
              <StatusBadge status={teacher.status} />
            </button>
          )}
        />
      )}

      {canCreate ? (
        <TeacherFormDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open && initialNew) {
              router.replace("/teachers", { scroll: false });
            }
          }}
        />
      ) : null}

      {editing ? (
        <TeacherFormDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          teacher={editing}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete teacher"
        description={
          deleting ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{teacherDisplayName(deleting)}</span>.
              This action cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete teacher"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
