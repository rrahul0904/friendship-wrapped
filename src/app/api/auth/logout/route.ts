import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set("story_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
