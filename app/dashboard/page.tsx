import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/spotify/session";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const result = await getValidSession();

  if (!result) {
    redirect("/?error=Please+connect+your+Spotify+account+to+continue.");
  }

  return <DashboardClient user={result.session.spotify!.user} />;
}
