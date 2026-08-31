import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/telemetry/route";

afterEach(() => {
  delete process.env.TELEMETRY_ENDPOINT;
  delete process.env.TELEMETRY_API_KEY;
  vi.unstubAllGlobals();
});

function request(body: unknown) {
  return new Request("https://threadtales.test/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("telemetry route", () => {
  it("returns 202 without external networking when no endpoint is configured", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await POST(request({ event: "story_viewed", product: "threadtales", mode: "friends", chatText: "PRIVATE" }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, delivered: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards only sanitized fields to an HTTPS endpoint", async () => {
    process.env.TELEMETRY_ENDPOINT = "https://telemetry.example/events";
    process.env.TELEMETRY_API_KEY = "server-secret";
    const fetchSpy = vi.fn(async (...args: Parameters<typeof fetch>): Promise<Response> => {
      void args;
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const response = await POST(request({
      event: "story_exported",
      product: "myyear",
      mode: "anniversary",
      participantName: "SECRET_PERSON",
      caption: "PRIVATE_CAPTION",
      location: "PRIVATE_LOCATION",
    }));
    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ accepted: true, delivered: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe("https://telemetry.example/events");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer server-secret", "Content-Type": "application/json" });
    const outbound = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(outbound.event).toBe("story_exported");
    expect(outbound.product).toBe("myyear");
    expect(outbound.mode).toBe("anniversary");
    expect(outbound.occurredAt).toEqual(expect.any(String));
    expect(JSON.stringify(outbound)).not.toContain("SECRET_PERSON");
    expect(JSON.stringify(outbound)).not.toContain("PRIVATE_CAPTION");
    expect(JSON.stringify(outbound)).not.toContain("PRIVATE_LOCATION");
  });

  it("rejects unsupported events before delivery", async () => {
    process.env.TELEMETRY_ENDPOINT = "https://telemetry.example/events";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await POST(request({ event: "raw_chat_uploaded", product: "threadtales" }));
    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("fails closed on a non-HTTPS telemetry destination without networking", async () => {
    process.env.TELEMETRY_ENDPOINT = "http://telemetry.example/events";
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await POST(request({ event: "analysis_started", product: "threadtales" }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Telemetry endpoint must use HTTPS." });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
