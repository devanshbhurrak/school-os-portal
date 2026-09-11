import { RolesPage } from "@/features/settings/roles-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function SettingsRolesRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Define roles and the permissions each one grants."
      />
      <RolesPage />
    </div>
  );
}