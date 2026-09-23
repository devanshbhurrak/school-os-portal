"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCohorts, listAcademicYears, listSubjects } from "@/services";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PageHeader } from "@/components/patterns/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TimetableGrid } from "@/features/timetables/timetable-grid";
import { PeriodDefinitionList } from "@/features/timetables/period-definition-list";

export default function TimetablesPage() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";

  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  const { data: yearsPage } = useQuery({
    queryKey: schoolKeys.years(schoolId),
    queryFn: () => listAcademicYears({ limit: 50 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.config,
  });
  const years = yearsPage?.items ?? [];

  const { data: cohortsPage } = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { academic_year_id: selectedYearId }),
    queryFn: () => listCohorts({ academic_year_id: selectedYearId, limit: 100 }),
    enabled: !!schoolId && !!selectedYearId,
    staleTime: STALE_TIME.config,
  });
  const cohorts = cohortsPage?.items ?? [];

  const { data: subjectsPage } = useQuery({
    queryKey: schoolKeys.subjects(schoolId),
    queryFn: () => listSubjects({ limit: 200 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.config,
  });
  const subjects = (subjectsPage?.items ?? []).map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timetables"
        description="Manage the weekly timetable and period definitions."
      />

      <div className="flex flex-wrap gap-4">
        <div className="space-y-1.5 w-48">
          <Label htmlFor="year-select">Academic year</Label>
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger id="year-select">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.id} value={y.id}>
                  {y.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedYearId && (
        <Tabs defaultValue="grid">
          <TabsList>
            <TabsTrigger value="grid">Timetable Grid</TabsTrigger>
            <TabsTrigger value="periods">Period Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4 pt-4">
            <div className="space-y-1.5 w-48">
              <Label htmlFor="cohort-select">Section</Label>
              <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
                <SelectTrigger id="cohort-select">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCohortId ? (
              <TimetableGrid
                cohortId={selectedCohortId}
                academicYearId={selectedYearId}
                subjects={subjects}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a section to view its timetable.</p>
            )}
          </TabsContent>

          <TabsContent value="periods" className="pt-4">
            <PeriodDefinitionList academicYearId={selectedYearId} />
          </TabsContent>
        </Tabs>
      )}

      {!selectedYearId && (
        <p className="text-sm text-muted-foreground">Select an academic year to get started.</p>
      )}
    </div>
  );
}
