import { redirect } from "next/navigation";

/**
 * /settings redirects to /settings/school — the first and most common sub-page.
 */
export default function SettingsIndexPage() {
  redirect("/settings/school");
}
