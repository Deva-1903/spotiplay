import { NextResponse } from "next/server";
import { clearSession } from "@/lib/spotify/session";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export async function POST(): Promise<NextResponse> {
  await clearSession();
  return NextResponse.redirect(`${APP_URL}/`);
}
