import { MembershipsPage } from "@/features/settings/memberships-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function SettingsMembershipsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Memberships"
        description="School access granted to users, and the roles they hold."
      />
      <MembershipsPage />
    </div>
  );
}