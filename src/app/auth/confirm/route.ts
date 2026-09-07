import { NextResponse } from "next/server";
import { verifyAuthToken } from "@/platform/persistence/supabase-rest";
import { setStoryAuthCookies } from "@/platform/identity/cookies";

export const runtime = "nodejs";

const allowedTypes = new Set(["email", "signup", "recovery", "magiclink"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/app";
  const fallback = new URL("/login", url.origin);

  if (!tokenHash || !type || !allowedTypes.has(type)) {
    fallback.searchParams.set("auth", "invalid-link");
    return NextResponse.redirect(fallback);
  }

  try {
    const session = await verifyAuthToken(tokenHash, type as "email" | "signup" | "recovery" | "magiclink");
    const destination = type === "recovery" ? "/reset-password" : next;
    return setStoryAuthCookies(NextResponse.redirect(new URL(destination, url.origin)), session);
  } catch {
    fallback.searchParams.set("auth", "failed");
    return NextResponse.redirect(fallback);
  }
}
