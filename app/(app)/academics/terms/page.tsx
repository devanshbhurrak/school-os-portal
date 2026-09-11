import { TermsPage } from "@/features/academics/academic-pages";
import { PageHeader } from "@/components/patterns/page-header";

export default function AcademicTermsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Terms"
        description="Periods within academic years, such as semesters."
      />
      <TermsPage />
    </div>
  );
}