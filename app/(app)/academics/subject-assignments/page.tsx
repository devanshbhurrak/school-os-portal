import { SubjectAssignmentsPage } from "@/features/academics/subject-assignments";
import { PageHeader } from "@/components/patterns/page-header";

export default function SubjectAssignmentsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject assignments"
        description="Which subjects each class takes, and for which years."
      />
      <SubjectAssignmentsPage />
    </div>
  );
}