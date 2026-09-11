"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { listAuditLogs } from "@/services";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { AUDIT_ACTION_LABELS } from "@/lib/display";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { Skeleton } from "@/components/ui/skeleton";

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "SCHOOL", label: "School" },
  { value: "USER", label: "User" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "ROLE", label: "Role" },
  { value: "PERSON", label: "Person" },
  { value: "CONTACT", label: "Contact" },
  { value: "ADDRESS", label: "Address" },
  { value: "ACADEMIC_YEAR", label: "Academic Year" },
  { value: "ACADEMIC_TERM", label: "Academic Term" },
  { value: "ACADEMIC_CLASS", label: "Class" },
  { value: "SUBJECT", label: "Subject" },
  { value: "CLASS_SUBJECT", label: "Subject Assignment" },
  { value: "COHORT", label: "Section" },
];

export function AuditPage() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";

  const [entityType, setEntityType] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

  const filterParams = {
    school_id: schoolId || undefined,
    entity_type: entityType || undefined,
    created_from: createdFrom || undefined,
    created_to: createdTo || undefined,
  };

  const pagination = useCursorPagination({
    queryKey: schoolKeys.audit(schoolId, filterParams),
    queryFn: (params) => listAuditLogs({ ...filterParams, ...params }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="audit-type">Entity type</Label>
            <select
              id="audit-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {ENTITY_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-from">From</Label>
            <Input
              id="audit-from"
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="audit-to">To</Label>
            <Input
              id="audit-to"
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
              className="w-40"
            />
          </div>

          {(entityType || createdFrom || createdTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEntityType("");
                setCreatedFrom("");
                setCreatedTo("");
              }}
            >
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Log list */}
      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : pagination.isInitialLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : pagination.items.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No audit logs"
          description="No activity has been recorded yet, or the current filters returned no results."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pagination.items.map((log) => (
                <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                    <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.summary ?? "—"}
                      {log.actor_label ? ` • ${log.actor_label}` : ""}
                      {log.entity_type ? ` • ${log.entity_type}` : ""}
                      {log.ip_address ? ` • ${log.ip_address}` : ""}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground whitespace-nowrap"
                    title={formatDateTime(log.created_at)}
                  >
                    {formatRelativeTime(log.created_at)}
                  </time>
                </li>
              ))}
            </ul>

            {pagination.hasMore && (
              <div className="flex justify-center p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={pagination.fetchMore}
                  disabled={pagination.isFetchingMore}
                >
                  {pagination.isFetchingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
