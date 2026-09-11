import { AuditPage } from "@/features/settings/audit-page";
import { PageHeader } from "@/components/patterns/page-header";

export default function SettingsAuditRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="A record of all actions taken within this school."
      />
      <AuditPage />
    </div>
  );
}
