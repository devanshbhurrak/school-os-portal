import { PageHeader } from "@/components/patterns/page-header";
import { SessionList } from "@/features/attendance/session-list";

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        description="Take and manage daily attendance for your school sections."
      />
      <SessionList />
    </div>
  );
}
