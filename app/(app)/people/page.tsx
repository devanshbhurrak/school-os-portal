import { PersonList } from "@/features/people/person-list";
import { PageHeader } from "@/components/patterns/page-header";

export default async function PeopleRoute({
  searchParams,
}: PageProps<"/people">) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Everyone in your school — students, staff, guardians, and contacts."
      />
      <PersonList initialNew={params.new === "1"} />
    </div>
  );
}