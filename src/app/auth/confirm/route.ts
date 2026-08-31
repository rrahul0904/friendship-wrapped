import { NextResponse } from "next/server";
import { verifyMagicLinkToken } from "@/platform/persistence/supabase-rest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const redirect = new URL("/account", url.origin);

  if (!tokenHash || type !== "email") {
    redirect.searchParams.set("auth", "invalid-link");
    return NextResponse.redirect(redirect);
  }

  try {
    const session = await verifyMagicLinkToken(tokenHash);
    const response = NextResponse.redirect(`${redirect.toString()}?auth=success`);
    response.cookies.set("story_access_token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(60, Math.min(session.expires_in || 3600, 60 * 60 * 24)),
    });
    return response;
  } catch {
    redirect.searchParams.set("auth", "failed");
    return NextResponse.redirect(redirect);
  }
}
