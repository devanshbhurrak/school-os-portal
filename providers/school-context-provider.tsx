"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setSchoolId } from "@/services/api-client";
import { listAcademicYears, listSchools } from "@/services";
import type { AcademicYear, School } from "@/types";
import { MAX_PAGE_SIZE, STORAGE_KEYS } from "@/lib/constants";
import { STALE_TIME } from "@/lib/constants";
import { useAuthContext } from "./auth-provider";

interface SchoolContextValue {
  schools: School[];
  isLoadingSchools: boolean;
  activeSchool: School | null;
  setActiveSchoolId: (schoolId: string) => void;
  years: AcademicYear[];
  isLoadingYears: boolean;
  activeYear: AcademicYear | null;
  setActiveYearId: (yearId: string) => void;
  refreshYears: () => void;
}

const SchoolContext = createContext<SchoolContextValue | null>(null);

export function SchoolContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const [activeSchoolId, setActiveSchoolIdState] = useState<string | null>(null);
  const [activeYearId, setActiveYearIdState] = useState<string | null>(null);

  const schoolsQuery = useQuery({
    queryKey: ["org", "schools"],
    queryFn: () => listSchools({ limit: MAX_PAGE_SIZE }),
    enabled: isAuthenticated,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const allSchools = useMemo(() => schoolsQuery.data ?? [], [schoolsQuery.data]);

  // Use accessible_school_ids from /auth/me to filter without an extra memberships fetch.
  // Platform admins have is_platform_admin=true and see all schools regardless.
  const accessibleSchools = useMemo(() => {
    if (!user) return [];
    if (user.is_platform_admin) return allSchools;
    const accessibleIds = new Set(user.accessible_school_ids);
    if (accessibleIds.size === 0) return allSchools; // fallback: show all
    return allSchools.filter((school) => accessibleIds.has(school.id));
  }, [user, allSchools]);

  const activeSchool = useMemo(
    () => accessibleSchools.find((s) => s.id === activeSchoolId) ?? null,
    [accessibleSchools, activeSchoolId],
  );

  useEffect(() => {
    if (!user || !accessibleSchools.length) return;
    queueMicrotask(() => {
      setActiveSchoolIdState((current) => {
        if (current && accessibleSchools.some((s) => s.id === current)) {
          return current;
        }
        const persisted = window.localStorage.getItem(STORAGE_KEYS.activeSchoolId);
        if (persisted && accessibleSchools.some((s) => s.id === persisted)) {
          return persisted;
        }
        if (user.school_id && accessibleSchools.some((s) => s.id === user.school_id)) {
          return user.school_id;
        }
        if (accessibleSchools.length === 1) return accessibleSchools[0].id;
        return null;
      });
    });
  }, [user, accessibleSchools]);

  const setActiveSchoolId = useCallback(
    (schoolId: string) => {
      if (schoolId === activeSchoolId) return;
      queryClient.removeQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "school",
      });
      setActiveSchoolIdState(schoolId);
    },
    [activeSchoolId, queryClient],
  );

  useEffect(() => {
    if (activeSchoolId) {
      setSchoolId(activeSchoolId);
      window.localStorage.setItem(STORAGE_KEYS.activeSchoolId, activeSchoolId);
    } else {
      setSchoolId(null);
    }
  }, [activeSchoolId]);

  const yearsQuery = useQuery({
    queryKey: ["school", activeSchoolId, "academic-years", { limit: MAX_PAGE_SIZE }],
    queryFn: () => listAcademicYears({ limit: MAX_PAGE_SIZE }),
    enabled: !!activeSchoolId,
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const years = useMemo(() => yearsQuery.data ?? [], [yearsQuery.data]);
  const activeYearKey = activeSchoolId
    ? `${STORAGE_KEYS.activeYearId}.${activeSchoolId}`
    : null;

  useEffect(() => {
    if (!years.length) return;
    queueMicrotask(() => {
      setActiveYearIdState((current) => {
        if (current && years.some((y) => y.id === current)) return current;
        const persisted =
          activeYearKey && window.localStorage.getItem(activeYearKey);
        if (persisted && years.some((y) => y.id === persisted)) return persisted;
        return years.find((y) => y.is_current)?.id ?? years[0].id;
      });
    });
  }, [years, activeYearKey]);

  const activeYear = useMemo(
    () => years.find((y) => y.id === activeYearId) ?? null,
    [years, activeYearId],
  );

  const setActiveYearId = useCallback(
    (yearId: string) => {
      setActiveYearIdState(yearId);
      if (activeYearKey) {
        window.localStorage.setItem(activeYearKey, yearId);
      }
    },
    [activeYearKey],
  );

  const refreshYears = useCallback(() => {
    if (activeSchoolId) {
      void queryClient.invalidateQueries({
        queryKey: ["school", activeSchoolId, "academic-years"],
      });
    }
  }, [activeSchoolId, queryClient]);

  const value = useMemo<SchoolContextValue>(
    () => ({
      schools: accessibleSchools,
      isLoadingSchools: schoolsQuery.isPending,
      activeSchool,
      setActiveSchoolId,
      years,
      isLoadingYears: yearsQuery.isPending,
      activeYear,
      setActiveYearId,
      refreshYears,
    }),
    [
      accessibleSchools,
      schoolsQuery.isPending,
      activeSchool,
      setActiveSchoolId,
      years,
      yearsQuery.isPending,
      activeYear,
      setActiveYearId,
      refreshYears,
    ],
  );

  return (
    <SchoolContext.Provider value={value}>{children}</SchoolContext.Provider>
  );
}

export function useSchoolContext(): SchoolContextValue {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchoolContext must be used within SchoolContextProvider");
  }
  return context;
}
