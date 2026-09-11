"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  listAcademicClasses,
  listAcademicYears,
  listAcademicTerms,
  listClassSubjects,
  listCohorts,
} from "@/services";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Alert {
  key: string;
  message: string;
  href: string;
}

export function NeedsAttention() {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";

  const canListClasses = hasPermission(PERMISSIONS.academicClass.list);
  const canListSubjects = hasPermission(PERMISSIONS.classSubject.list);
  const canListYears = hasPermission(PERMISSIONS.academicYear.list);
  const canListTerms = hasPermission(PERMISSIONS.academicTerm.list);
  const canListCohorts = hasPermission(PERMISSIONS.cohort.list);

  const classesQuery = useQuery({
    queryKey: schoolKeys.classes(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicClasses({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && canListClasses,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const classSubjectsQuery = useQuery({
    queryKey: schoolKeys.classSubjects(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listClassSubjects({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && canListSubjects,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const yearsQuery = useQuery({
    queryKey: schoolKeys.years(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicYears({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && canListYears,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const termsQuery = useQuery({
    queryKey: schoolKeys.terms(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicTerms({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && canListTerms,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listCohorts({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && canListCohorts,
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  const alerts: Alert[] = [];

  // Classes with no subject assignments
  if (classesQuery.data && classSubjectsQuery.data) {
    const assignedClassIds = new Set(
      classSubjectsQuery.data.map((cs) => cs.academic_class_id),
    );
    const unassigned = classesQuery.data.filter(
      (c) => !assignedClassIds.has(c.id),
    );
    if (unassigned.length > 0) {
      alerts.push({
        key: "classes-no-subjects",
        message: `${unassigned.length} ${unassigned.length === 1 ? "class has" : "classes have"} no subjects assigned`,
        href: "/academics/subject-assignments",
      });
    }
  }

  // Academic years with no terms
  if (yearsQuery.data && termsQuery.data) {
    const yearIdsWithTerms = new Set(
      termsQuery.data.map((t) => t.academic_year_id),
    );
    const yearsWithNoTerms = yearsQuery.data.filter(
      (y) => !yearIdsWithTerms.has(y.id),
    );
    if (yearsWithNoTerms.length > 0) {
      alerts.push({
        key: "years-no-terms",
        message: `${yearsWithNoTerms.length} academic ${yearsWithNoTerms.length === 1 ? "year has" : "years have"} no terms defined`,
        href: "/academics/terms",
      });
    }
  }

  // Sections (cohorts) without capacity set
  if (cohortsQuery.data) {
    const noCapacity = cohortsQuery.data.filter(
      (c) => c.capacity == null && c.status === "ACTIVE",
    );
    if (noCapacity.length > 0) {
      alerts.push({
        key: "cohorts-no-capacity",
        message: `${noCapacity.length} active ${noCapacity.length === 1 ? "section has" : "sections have"} no capacity set`,
        href: "/academics/cohorts",
      });
    }
  }

  // Don't render anything if no issues found or still loading
  const isLoading =
    (canListClasses && classesQuery.isPending) ||
    (canListSubjects && classSubjectsQuery.isPending) ||
    (canListYears && yearsQuery.isPending) ||
    (canListTerms && termsQuery.isPending) ||
    (canListCohorts && cohortsQuery.isPending);

  if (!isLoading && alerts.length === 0) return null;
  if (isLoading) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-400">
          <AlertTriangle className="size-4" aria-hidden />
          Needs attention
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <Link
            key={alert.key}
            href={alert.href}
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
          >
            <span>{alert.message}</span>
            <ArrowRight className="size-4 shrink-0 text-amber-600 dark:text-amber-500" aria-hidden />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
