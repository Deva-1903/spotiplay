import { redirect } from "next/navigation";
import { getValidSession } from "@/lib/spotify/session";
import { ResultsClient } from "@/components/results/ResultsClient";

export default async function ResultsPage() {
  const result = await getValidSession();

  if (!result) {
    redirect("/?error=Please+connect+your+Spotify+account+to+continue.");
  }

  return <ResultsClient />;
}
