"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    router.replace(user?.must_change_password ? "/force-change-password" : "/home");
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="w-full max-w-sm space-y-4 p-6">
        <Skeleton className="mx-auto size-12 rounded-xl" />
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}