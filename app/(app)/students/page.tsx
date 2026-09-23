import { StudentList } from "@/features/students/student-list";
import { PageHeader } from "@/components/patterns/page-header";

export default async function StudentsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Manage student enrollments for your school."
      />
      <StudentList />
    </div>
  );
}
