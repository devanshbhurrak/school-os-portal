import { RoleDetailPage } from "@/features/settings/role-detail";

export default async function SettingsRoleDetailRoute({
  params,
}: PageProps<"/settings/roles/[roleId]">) {
  const { roleId } = await params;
  return <RoleDetailPage roleId={roleId} />;
}