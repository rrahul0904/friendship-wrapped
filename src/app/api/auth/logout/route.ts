import { NextResponse } from "next/server";
import { clearStoryAuthCookies } from "@/platform/identity/cookies";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const response = NextResponse.json({ signedOut: true });
  return clearStoryAuthCookies(response);
}
