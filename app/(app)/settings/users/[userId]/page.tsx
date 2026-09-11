import { UserDetailPage } from "@/features/settings/user-detail";

export default async function SettingsUserDetailRoute({
  params,
}: PageProps<"/settings/users/[userId]">) {
  const { userId } = await params;
  return <UserDetailPage userId={userId} />;
}