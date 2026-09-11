"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarRange,
  GraduationCap,
  History,
  Loader2,
  Settings,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs, listCohorts, listPersons } from "@/services";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { AUDIT_ACTION_LABELS } from "@/lib/display";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { NeedsAttention } from "./needs-attention";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const QUICK_LINKS = [
  {
    href: "/people",
    icon: Users,
    title: "People",
    description: "Staff, students and guardians",
  },
  {
    href: "/academics/years",
    icon: CalendarRange,
    title: "Academics",
    description: "Years, terms, classes and subjects",
  },
  {
    href: "/settings/school",
    icon: Settings,
    title: "Settings",
    description: "School, users and roles",
  },
];

export function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeSchool, activeYear } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";

  const personsQuery = useQuery({
    queryKey: schoolKeys.persons(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listPersons({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.person.list),
    staleTime: STALE_TIME.frequent,
  });

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listCohorts({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.cohort.list),
    staleTime: STALE_TIME.frequent,
  });

  const activity = useCursorPagination({
    queryKey: schoolKeys.audit(schoolId),
    queryFn: (params) =>
      listAuditLogs({ school_id: schoolId || undefined, ...params }),
    enabled: !!schoolId,
    limit: 10,
    staleTime: STALE_TIME.frequent,
  });

  function countLabel(
    data: { items: unknown[]; has_more: boolean } | undefined,
    isPending: boolean,
  ) {
    if (isPending) return null;
    if (!data) return "—";
    return data.has_more ? `${data.items.length}+` : String(data.items.length);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user?.email ? `, ${user.email}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          {activeSchool?.name ?? "Loading school…"}
          {activeYear
            ? ` • Academic year ${activeYear.name}`
            : " • No active academic year"}
        </p>
      </div>

      <OverviewCards
        personsLabel={countLabel(personsQuery.data, personsQuery.isPending)}
        cohortsLabel={countLabel(cohortsQuery.data, cohortsQuery.isPending)}
        yearName={activeYear?.name}
        loading={!activeSchool}
      />

      <NeedsAttention />

      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.href}
            type="button"
            onClick={() => router.push(link.href)}
            className="group rounded-lg border bg-card p-4 text-left shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between">
              <link.icon className="size-5 text-muted-foreground" aria-hidden />
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="mt-3 font-medium">{link.title}</p>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-muted-foreground" />
            Recent activity
          </CardTitle>
          {activity.hasMore ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={activity.fetchMore}
              disabled={activity.isFetchingMore}
            >
              {activity.isFetchingMore && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Load more
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {activity.isInitialLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : activity.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Activity log is unavailable right now.
            </p>
          ) : activity.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <ul className="divide-y">
              {activity.items.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.summary ?? "—"}
                      {log.actor_label ? ` • ${log.actor_label}` : ""}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    title={formatDateTime(log.created_at)}
                  >
                    {formatRelativeTime(log.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface OverviewCardsProps {
  personsLabel: string | null;
  cohortsLabel: string | null;
  yearName?: string;
  loading: boolean;
}

function OverviewCards({
  personsLabel,
  cohortsLabel,
  yearName,
  loading,
}: OverviewCardsProps) {
  const cards = [
    {
      label: "People",
      value: personsLabel,
      icon: Users,
    },
    {
      label: "Sections",
      value: cohortsLabel,
      icon: GraduationCap,
    },
    {
      label: "Active year",
      value: yearName ?? "Not set",
      icon: CalendarRange,
      skipCount: true,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted">
              <card.icon className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">
                {(loading || (!card.skipCount && card.value === null)) ? (
                  <Skeleton className="h-6 w-16" />
                ) : (
                  card.value ?? "—"
                )}
              </p>
              <p className="text-sm text-muted-foreground">{card.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}