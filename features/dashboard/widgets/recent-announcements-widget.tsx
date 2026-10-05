"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listAnnouncements } from "@/services/announcements";
import { useSchoolContext } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { formatRelativeTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentAnnouncementsWidget() {
  const { activeSchool } = useSchoolContext();
  const schoolId = activeSchool?.id ?? "";

  const { data, isPending, isError } = useQuery({
    queryKey: schoolKeys.announcements(schoolId, { status: "PUBLISHED", limit: 3 }),
    queryFn: () => listAnnouncements({ status: "PUBLISHED", limit: 3 }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Megaphone className="size-4 text-muted-foreground" aria-hidden />
          Recent Announcements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Announcements are unavailable right now.
          </p>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No published announcements.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((announcement) => (
              <li key={announcement.id} className="py-2.5">
                <p className="truncate text-sm font-medium">{announcement.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(announcement.published_at ?? announcement.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3">
          <Link
            href="/announcements"
            className="text-xs text-primary hover:underline"
          >
            View all announcements →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
