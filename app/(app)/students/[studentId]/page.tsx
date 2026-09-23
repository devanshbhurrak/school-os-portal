import { StudentProfile } from "@/features/students/student-profile";

export default async function StudentDetailRoute({
  params,
}: PageProps<"/students/[studentId]">) {
  const { studentId } = await params;
  return <StudentProfile studentId={studentId} />;
}
