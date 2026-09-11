import { YearDetailPage } from "@/features/academics/year-detail";

export default async function AcademicYearDetailRoute({
  params,
}: PageProps<"/academics/years/[yearId]">) {
  const { yearId } = await params;
  return <YearDetailPage yearId={yearId} />;
}