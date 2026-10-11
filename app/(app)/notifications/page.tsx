import { NotificationList } from "@/features/notifications/notification-list";
import { PageHeader } from "@/components/patterns/page-header";

export default function NotificationsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Announcements, attendance updates, and system messages."
      />
      <NotificationList />
    </div>
  );
}
