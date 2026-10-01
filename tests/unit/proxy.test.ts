import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";

describe("account route proxy", () => {
  it.each(["/app", "/albums", "/settings", "/billing", "/admin", "/worlds/123"])("redirects unauthenticated %s requests to login", (path) => {
    const response = proxy(new NextRequest(`https://threadtales.test${path}?private=1`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("location")).toContain(encodeURIComponent(path));
  });

  it("allows a session cookie through to route-level authorization", () => {
    const request = new NextRequest("https://threadtales.test/worlds/123", { headers: { cookie: "story_access_token=session" } });
    expect(proxy(request).headers.get("location")).toBeNull();
  });

  it("leaves public product routes available without a session", () => {
    const response = proxy(new NextRequest("https://threadtales.test/products/petlife"));
    expect(response.headers.get("location")).toBeNull();
  });
});
