import { ParentProfile } from "@/features/parents/parent-profile";

export default async function ParentDetailRoute({
  params,
}: {
  params: Promise<{ parentId: string }>;
}) {
  const { parentId } = await params;
  return <ParentProfile parentId={parentId} />;
}
