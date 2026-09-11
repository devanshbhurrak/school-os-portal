import { CohortDetailPage } from "@/features/academics/cohort-detail";

export default async function AcademicCohortDetailRoute({
  params,
}: PageProps<"/academics/cohorts/[cohortId]">) {
  const { cohortId } = await params;
  return <CohortDetailPage cohortId={cohortId} />;
}