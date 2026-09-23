import { TeacherProfile } from "@/features/teachers/teacher-profile";

export default async function TeacherDetailRoute({
  params,
}: PageProps<"/teachers/[teacherId]">) {
  const { teacherId } = await params;
  return <TeacherProfile teacherId={teacherId} />;
}
