import { YearsPage } from "@/features/academics/academic-pages";
import { PageHeader } from "@/components/patterns/page-header";

export default function AcademicYearsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic years"
        description="The school calendar — years, terms, and the current year."
      />
      <YearsPage />
    </div>
  );
}