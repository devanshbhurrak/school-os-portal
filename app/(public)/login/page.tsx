import { LoginPage } from "@/features/auth/login-page";

export default async function LoginRoute({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  return <LoginPage notice={params.changed === "1" ? "changed" : null} />;
}