import { PersonProfile } from "@/features/people/person-profile";

export default async function PersonDetailRoute({
  params,
}: PageProps<"/people/[personId]">) {
  const { personId } = await params;
  return <PersonProfile personId={personId} />;
}