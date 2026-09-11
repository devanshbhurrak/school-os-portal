import { UsersPage } from "@/features/settings/users-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function SettingsUsersRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Accounts for staff, teachers and administrators."
      />
      <UsersPage />
    </div>
  );
}