"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { listEnrollments, createEnrollment } from "@/services";
import type { Enrollment, EnrollmentCreate } from "@/types/student";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { PermissionGate } from "@/components/ui/permission-gate";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransferDialog } from "./transfer-dialog";

interface EnrollmentTabProps {
  studentId: string;
}

export function EnrollmentTab({ studentId }: EnrollmentTabProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [transferOpen, setTransferOpen] = useState(false);
  const [transferEnrollment, setTransferEnrollment] = useState<Enrollment | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: schoolKeys.enrollments(schoolId, { student_id: studentId }),
    queryFn: () => listEnrollments({ student_id: studentId }),
    enabled: !!schoolId && !!studentId,
    staleTime: STALE_TIME.entity,
  });

  const enrollments = data?.items ?? [];
  const activeEnrollment = enrollments.find((e) => e.status === "ACTIVE") ?? null;

  function handleTransferClick(enrollment: Enrollment) {
    setTransferEnrollment(enrollment);
    setTransferOpen(true);
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted-foreground">
          Loading enrollment data…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-destructive">
          Failed to load enrollments.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current active enrollment */}
      {activeEnrollment ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Current Enrollment</CardTitle>
            <PermissionGate permission={PERMISSIONS.enrollment.transfer}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTransferClick(activeEnrollment)}
              >
                <ArrowRightLeft className="size-4" />
                Transfer
              </Button>
            </PermissionGate>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Academic Year</p>
              <p className="text-sm font-medium">{activeEnrollment.academic_year_name ?? activeEnrollment.academic_year_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Section</p>
              <p className="text-sm font-medium">{activeEnrollment.cohort_name ?? activeEnrollment.cohort_id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Roll Number</p>
              <p className="text-sm font-medium">{activeEnrollment.roll_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="text-sm font-medium">{formatDate(activeEnrollment.start_date)}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-sm text-muted-foreground">No active enrollment for this student.</p>
            <PermissionGate permission={PERMISSIONS.enrollment.create}>
              <Button variant="outline" size="sm" disabled>
                <PlusCircle className="size-4" />
                Enroll
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      )}

      {/* Enrollment history */}
      {enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="font-medium">
                      {enrollment.academic_year_name ?? enrollment.academic_year_id}
                    </TableCell>
                    <TableCell>{enrollment.cohort_name ?? enrollment.cohort_id}</TableCell>
                    <TableCell>{enrollment.roll_number ?? "—"}</TableCell>
                    <TableCell className="capitalize">{enrollment.enrollment_type.replace("_", " ").toLowerCase()}</TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell>{formatDate(enrollment.start_date)}</TableCell>
                    <TableCell>{enrollment.end_date ? formatDate(enrollment.end_date) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {transferEnrollment && (
        <TransferDialog
          open={transferOpen}
          onOpenChange={setTransferOpen}
          enrollment={transferEnrollment}
          onTransferred={() => {
            void queryClient.invalidateQueries({
              queryKey: schoolKeys.enrollments(schoolId, { student_id: studentId }),
            });
          }}
        />
      )}
    </div>
  );
}
