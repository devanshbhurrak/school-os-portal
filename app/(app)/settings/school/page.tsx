import { SchoolSettingsPage } from "@/features/settings/school-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function SchoolSettingsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="School settings"
        description="Basic information about the school."
      />
      <SchoolSettingsPage />
    </div>
  );
}