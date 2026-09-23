"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteStudent, getStudent } from "@/services";
import type { Student } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudentFormDialog } from "./student-form-dialog";
import { EnrollmentTab } from "./enrollment-tab";
import { GuardiansTab } from "./guardians-tab";
import { StudentAttendanceTab } from "./student-attendance-tab";

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function studentDisplayName(student: Student): string {
  return [student.person_first_name, student.person_last_name].filter(Boolean).join(" ");
}

export function StudentProfile({ studentId }: { studentId: string }) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: student, isLoading, isError, error, refetch } = useQuery({
    queryKey: schoolKeys.student(schoolId, studentId),
    queryFn: () => getStudent(studentId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.entity,
  });

  async function handleDelete() {
    if (!student) return;
    try {
      await deleteStudent(student.id, student.version);
      toast.success("Student deleted");
      void queryClient.invalidateQueries({ queryKey: schoolKeys.students(schoolId) });
      router.push("/students");
    } catch (err) {
      showMutationError(err);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !student) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/students")}
            aria-label="Back to students"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{studentDisplayName(student)}</h1>
            <p className="text-sm text-muted-foreground">{student.admission_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <PermissionGate permission={PERMISSIONS.student.update}>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.student.delete}>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap className="size-4" />
                Student information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Admission number" value={student.admission_number} />
              <InfoItem label="Admission date" value={formatDate(student.admission_date)} />
              <InfoItem label="Status" value={<StatusBadge status={student.status} />} />
              {student.withdrawal_date && (
                <InfoItem label="Withdrawal date" value={formatDate(student.withdrawal_date)} />
              )}
              {student.withdrawal_reason && (
                <InfoItem label="Withdrawal reason" value={student.withdrawal_reason} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Person information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Name" value={studentDisplayName(student)} />
              <InfoItem
                label="Email"
                value={
                  student.person_primary_email ? (
                    <span className="flex items-center gap-1">
                      <Mail className="size-3" />
                      {student.person_primary_email}
                    </span>
                  ) : null
                }
              />
              <InfoItem
                label="Phone"
                value={
                  student.person_primary_phone ? (
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {student.person_primary_phone}
                    </span>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollment" className="pt-4">
          <EnrollmentTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="guardians" className="pt-4">
          <GuardiansTab studentId={studentId} />
        </TabsContent>

        <TabsContent value="attendance" className="pt-4">
          <StudentAttendanceTab studentId={studentId} />
        </TabsContent>
      </Tabs>

      <StudentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSaved={(updated) => {
          queryClient.setQueryData(schoolKeys.student(schoolId, updated.id), updated);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student"
        description={
          <>
            This will permanently delete{" "}
            <span className="font-medium">{studentDisplayName(student)}</span>.
            This action cannot be undone.
          </>
        }
        confirmLabel="Delete student"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
