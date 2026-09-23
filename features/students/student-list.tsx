"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteStudent, listStudents } from "@/services";
import type { ColumnDef } from "@tanstack/react-table";
import type { Student, StudentStatus } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
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
import { GraduationCap, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/ui/permission-gate";
import { StudentFormDialog } from "./student-form-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS: (StudentStatus | "ALL")[] = [
  "ALL", "ACTIVE", "WITHDRAWN", "GRADUATED", "TRANSFERRED", "INACTIVE", "DECEASED",
];

function studentDisplayName(student: Student): string {
  return [student.person_first_name, student.person_last_name].filter(Boolean).join(" ");
}

export function StudentList() {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StudentStatus | "ALL">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);

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
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  };

  const pagination = useCursorPagination<Student>({
    queryKey: schoolKeys.students(schoolId, params),
    queryFn: (p) => listStudents({ ...params, ...p }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteStudent(deleting.id, deleting.version);
      toast.success("Student deleted", {
        description: `${studentDisplayName(deleting)} was removed.`,
      });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.students(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.student.create);

  const columns = useMemo<ColumnDef<DataTableFeatures, Student, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (s) => studentDisplayName(s),
        header: "Name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{studentDisplayName(row.original)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {row.original.person_primary_email ?? row.original.person_primary_phone ?? "No contact info"}
            </p>
          </div>
        ),
      },
      {
        id: "admission_number",
        accessorFn: (s) => s.admission_number,
        header: "Admission No.",
        cell: ({ row }) => (
          <span className="text-sm font-mono">{row.original.admission_number}</span>
        ),
      },
      {
        id: "admission_date",
        accessorFn: (s) => s.admission_date,
        header: "Admission Date",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.admission_date)}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (s) => s.status,
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
                <PermissionGate permission={PERMISSIONS.student.update}>
                  <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.student.delete}>
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
            placeholder="Search by name or admission no…"
            className="pl-9"
            aria-label="Search students"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StudentStatus | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <PermissionGate permission={PERMISSIONS.student.create}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add student
            </Button>
          </PermissionGate>
        </div>
      </div>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<Student>
          columns={columns}
          data={pagination.items}
          rowKey={(student) => student.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={(student) => router.push(`/students/${student.id}`)}
          emptyState={
            <EmptyState
              icon={GraduationCap}
              title={pagination.items.length ? "No matching students" : "No students yet"}
              description={
                pagination.items.length
                  ? "Try changing your filters or search terms."
                  : "Add your first student to get started."
              }
              action={
                canCreate && !pagination.items.length ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    Add student
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(student) => (
            <button
              type="button"
              onClick={() => router.push(`/students/${student.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{studentDisplayName(student)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {student.admission_number}
                </p>
              </div>
              <StatusBadge status={student.status} />
            </button>
          )}
        />
      )}

      {canCreate ? (
        <StudentFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      ) : null}

      {editing ? (
        <StudentFormDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          student={editing}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete student"
        description={
          deleting ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{studentDisplayName(deleting)}</span>.
              This action cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete student"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
