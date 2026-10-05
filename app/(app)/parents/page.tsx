import { ParentList } from "@/features/parents/parent-list";
import { PageHeader } from "@/components/patterns/page-header";

export default async function ParentsRoute() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        description="Manage parents and their links to students."
      />
      <ParentList />
    </div>
  );
}
