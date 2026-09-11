import { SubjectsPage } from "@/features/academics/academic-pages";
import { PageHeader } from "@/components/patterns/page-header";

export default function AcademicSubjectsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Subjects"
        description="Subjects taught at the school, such as Mathematics and Science."
      />
      <SubjectsPage />
    </div>
  );
}