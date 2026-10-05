"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCurrentUser } from "@/hooks/use-auth";
import { orgKeys } from "@/lib/query-keys";
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";
import type { Notification, NotificationType } from "@/types/notification";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const orgId = user?.organization_id ?? "";

  const { data: unreadData } = useQuery({
    queryKey: orgKeys.unreadCount(orgId),
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    enabled: !!orgId,
  });

  const { data: notificationsPage } = useQuery({
    queryKey: orgKeys.notifications(orgId, { limit: 10 }),
    queryFn: () => listNotifications({ limit: 10 }),
    enabled: open && !!orgId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: orgKeys.unreadCount(orgId) });
    queryClient.invalidateQueries({
      queryKey: ["org", orgId, "notifications"],
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

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsPage?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4.5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="size-3.5" aria-hidden />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No notifications
            </p>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n: Notification) => (
                <button
                  key={n.id}
                  type="button"
                  className={`flex flex-col gap-1 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 ${
                    !n.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => {
                    if (!n.is_read) {
                      markOneMutation.mutate(n.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.body && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={TYPE_VARIANTS[n.type]} className="text-[10px] px-1.5 py-0">
                      {TYPE_LABELS[n.type]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
