"use client";

import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { Notification, NotificationType } from "@/types/notification";
import { notificationHref } from "./notification-links";

const TYPE_LABELS: Record<NotificationType, string> = {
  ANNOUNCEMENT: "Announcement",
  ATTENDANCE: "Attendance",
  ENROLLMENT: "Enrollment",
  SYSTEM: "System",
};

const TYPE_VARIANTS: Record<NotificationType, "default" | "secondary" | "outline" | "destructive"> = {
  ANNOUNCEMENT: "default",
  ATTENDANCE: "secondary",
  ENROLLMENT: "secondary",
  SYSTEM: "outline",
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All types" },
  { value: "ANNOUNCEMENT", label: "Announcements" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "ENROLLMENT", label: "Enrollments" },
  { value: "SYSTEM", label: "System" },
];

export function NotificationList() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const orgId = user?.organization_id ?? "";
  const [typeFilter, setTypeFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const filterParams = {
    type: typeFilter || undefined,
    is_read: unreadOnly ? false : undefined,
  };

  const pagination = useCursorPagination({
    queryKey: orgKeys.notifications(orgId, {
      ...filterParams,
      page: "list",
    }),
    queryFn: (params) => listNotifications({ ...filterParams, ...params }),
    enabled: !!orgId,
    staleTime: STALE_TIME.frequent,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: orgKeys.unreadCount(orgId) });
    queryClient.invalidateQueries({
      queryKey: orgKeys.notifications(orgId),
    });
  };

  const markOneMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  function openNotification(n: Notification) {
    if (!n.is_read) {
      markOneMutation.mutate(n.id);
    }
    window.location.href = notificationHref(n);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <label htmlFor="notif-type" className="text-sm font-medium">
              Type
            </label>
            <select
              id="notif-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="size-4 rounded border"
            />
            Unread only
          </label>
          <div className="sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="size-4" aria-hidden />
              Mark all read
            </Button>
          </div>
        </CardContent>
      </Card>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : pagination.isInitialLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : pagination.items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You're all caught up. New announcements and attendance updates will appear here."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {pagination.items.map((n: Notification) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-muted/50 ${
                      !n.is_read ? "bg-muted/30" : ""
                    }`}
                  >
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${
                        !n.is_read ? "bg-primary" : "bg-transparent"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">
                        {n.title}
                      </span>
                      {n.body && (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1.5 flex items-center gap-2">
                        <Badge variant={TYPE_VARIANTS[n.type]} className="px-1.5 py-0 text-[10px]">
                          {TYPE_LABELS[n.type]}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                      </span>
                    </span>
                  </button>
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
