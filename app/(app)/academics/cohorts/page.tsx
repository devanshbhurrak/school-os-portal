import { CohortsPage } from "@/features/academics/academic-pages";
import { PageHeader } from "@/components/patterns/page-header";

export default function AcademicCohortsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Sections of a class in an academic year, e.g. Grade 6 A."
      />
      <CohortsPage />
    </div>
  );
}