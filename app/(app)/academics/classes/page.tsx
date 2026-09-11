import { ClassesPage } from "@/features/academics/academic-pages";
import { PageHeader } from "@/components/patterns/page-header";

export default function AcademicClassesRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        description="Class groups such as Grade 6, Grade 7."
      />
      <ClassesPage />
    </div>
  );
}