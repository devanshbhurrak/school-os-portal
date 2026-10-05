"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Calendar, Hash, Mail, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTeacher, getTeacher } from "@/services";
import { useSchoolContext } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, initials } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState } from "@/components/patterns/error-state";
import { TeacherFormDialog } from "./teacher-form-dialog";
import { AssignmentTab } from "./assignment-tab";

function InfoItem({ icon: Icon, label, value }: { icon: typeof Briefcase; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function teacherDisplayName(firstName: string, lastName?: string | null) {
  return [firstName, lastName].filter(Boolean).join(" ");
}

export function TeacherProfile({ teacherId }: { teacherId: string }) {
  const { activeSchool } = useSchoolContext();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [deletingTeacher, setDeletingTeacher] = useState(false);

  const teacherQuery = useQuery({
    queryKey: schoolKeys.teacher(schoolId, teacherId),
    queryFn: () => getTeacher(teacherId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  if (teacherQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </CardContent>
        </Card>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (teacherQuery.isError) {
    return (
      <ErrorState
        error={teacherQuery.error}
        onRetry={() => void teacherQuery.refetch()}
      />
    );
  }

  const teacher = teacherQuery.data!;
  const displayName = teacherDisplayName(teacher.person_first_name, teacher.person_last_name);
  const canEdit = hasPermission(PERMISSIONS.teacher.update);

  async function handleDelete() {
    try {
      await deleteTeacher(teacher.id, teacher.version);
      queryClient.removeQueries({ queryKey: schoolKeys.teacher(schoolId, teacher.id) });
      void queryClient.invalidateQueries({ queryKey: schoolKeys.teachers(schoolId) });
      toast.success("Teacher deleted");
      router.push("/teachers");
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/teachers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to teachers
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{displayName}</h1>
                <StatusBadge status={teacher.status} />
              </div>
              {teacher.designation ? (
                <p className="text-sm text-muted-foreground">{teacher.designation}</p>
              ) : null}
              {teacher.person_primary_email ? (
                <p className="text-sm text-muted-foreground">{teacher.person_primary_email}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PermissionGate permission={PERMISSIONS.teacher.update}>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.teacher.delete}>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingTeacher(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem
                icon={Hash}
                label="Employee number"
                value={teacher.employee_number ?? "—"}
              />
              <InfoItem
                icon={Briefcase}
                label="Designation"
                value={teacher.designation ?? "—"}
              />
              <InfoItem
                icon={Calendar}
                label="Joining date"
                value={teacher.joining_date ? formatDate(teacher.joining_date) : "—"}
              />
              <InfoItem
                icon={Calendar}
                label="Leaving date"
                value={teacher.leaving_date ? formatDate(teacher.leaving_date) : "—"}
              />
              <InfoItem
                icon={Mail}
                label="Email"
                value={teacher.person_primary_email ?? "—"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <AssignmentTab teacherId={teacherId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
          <Card>
            <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">Timetable coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canEdit ? (
        <TeacherFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          teacher={teacher}
          onSaved={(saved) => {
            queryClient.setQueryData(schoolKeys.teacher(schoolId, saved.id), saved);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deletingTeacher}
        onOpenChange={setDeletingTeacher}
        title="Delete teacher"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{displayName}</span>.
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete teacher"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
