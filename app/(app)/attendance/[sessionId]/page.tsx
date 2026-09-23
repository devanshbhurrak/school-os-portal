"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/patterns/page-header";
import { AttendanceSheet } from "@/features/attendance/attendance-sheet";

export default function AttendanceSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/attendance")}
          aria-label="Back to attendance"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <PageHeader
          title="Attendance Sheet"
          description="Record student attendance for this session."
        />
      </div>
      <AttendanceSheet sessionId={sessionId} />
    </div>
  );
}
