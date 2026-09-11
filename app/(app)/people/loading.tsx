import { Skeleton } from "@/components/ui/skeleton";

/**
 * People list loading skeleton — shown while the People page suspends.
 */
export default function PeopleLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Search / filter bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-64" />
      </div>

      {/* Table — desktop */}
      <div className="hidden overflow-hidden rounded-lg border md:block">
        {/* Header */}
        <div className="flex gap-4 bg-muted/40 px-4 py-2.5">
          {[180, 140, 100, 80].map((w) => (
            <Skeleton key={w} style={{ width: w }} className="h-3.5" />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      {/* Cards — mobile */}
      <div className="space-y-2 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
