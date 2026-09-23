import { AnnouncementDetail } from "@/features/announcements/announcement-detail";

export default async function AnnouncementDetailRoute({
  params,
}: PageProps<"/announcements/[announcementId]">) {
  const { announcementId } = await params;
  return <AnnouncementDetail announcementId={announcementId} />;
}
