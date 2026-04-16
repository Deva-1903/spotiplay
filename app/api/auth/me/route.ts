import { NextResponse } from "next/server";
import { getValidSession } from "@/lib/spotify/session";

export async function GET(): Promise<NextResponse> {
  const result = await getValidSession();

  if (!result) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: result.session.spotify!.user,
  });
}
