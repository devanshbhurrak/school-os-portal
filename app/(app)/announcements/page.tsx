import { AnnouncementList } from "@/features/announcements/announcement-list";
import { PageHeader } from "@/components/patterns/page-header";

export default async function AnnouncementsRoute({
  searchParams,
}: PageProps<"/announcements">) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Communicate with your school community."
      />
      <AnnouncementList initialNew={params.new === "1"} />
    </div>
  );
}
