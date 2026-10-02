import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ai/enrich/route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AI enrichment request boundary", () => {
  it("rejects oversized bodies before calling the provider", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const request = new Request("https://threadtales.test/api/ai/enrich", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(17 * 1024) }),
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
