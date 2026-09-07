import { NextRequest, NextResponse } from "next/server";

const protectedPrefixes = ["/app", "/albums", "/settings", "/billing", "/admin"];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (!protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) return NextResponse.next();
  const hasSession = Boolean(request.cookies.get("story_access_token")?.value || request.cookies.get("story_refresh_token")?.value);
  if (hasSession) return NextResponse.next();
  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/app/:path*", "/albums/:path*", "/settings/:path*", "/billing/:path*", "/admin/:path*"],
};
