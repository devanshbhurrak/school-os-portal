import { ReportsPage } from "@/features/reports/reports-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function ReportsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Export student, attendance, and teacher data as CSV."
      />
      <ReportsPage />
    </div>
  );
}
