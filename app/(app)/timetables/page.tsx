"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listCohorts, listSubjects } from "@/services";
import { useSchoolContext } from "@/hooks/use-school-context";
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
import { TimetableList } from "@/features/timetables/timetable-list";
import { PeriodDefinitionList } from "@/features/timetables/period-definition-list";

export default function TimetablesPage() {
  const { activeSchool, activeYear } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";
  const activeYearId = activeYear?.id ?? "";

  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  const { data: cohortsPage } = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { academic_year_id: activeYearId }),
    queryFn: () => listCohorts({ academic_year_id: activeYearId, limit: 100 }),
    enabled: !!schoolId && !!activeYearId,
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

      {!activeYearId && (
        <p className="text-sm text-muted-foreground">Select an academic year to get started.</p>
      )}

      {activeYearId && (
        <Tabs defaultValue="timetables">
          <TabsList>
            <TabsTrigger value="timetables">Timetables</TabsTrigger>
            <TabsTrigger value="periods">Period Definitions</TabsTrigger>
          </TabsList>

          <TabsContent value="timetables" className="space-y-6 pt-4">
            <TimetableList
              academicYearId={activeYearId}
              selectedId={selectedTimetableId}
              onSelect={setSelectedTimetableId}
            />

            {selectedTimetableId && (
              <div className="space-y-4">
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
                    academicYearId={activeYearId}
                    subjects={subjects}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Select a section to view its timetable.
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="periods" className="pt-4">
            <PeriodDefinitionList academicYearId={activeYearId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
