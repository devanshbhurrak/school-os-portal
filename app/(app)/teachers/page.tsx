import { TeacherList } from "@/features/teachers/teacher-list";
import { PageHeader } from "@/components/patterns/page-header";

export default async function TeachersRoute({
  searchParams,
}: PageProps<"/teachers">) {
  const params = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description="Manage teaching staff and their assignments."
      />
      <TeacherList initialNew={params.new === "1"} />
    </div>
  );
}
