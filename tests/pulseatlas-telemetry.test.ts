import { describe, expect, it } from "vitest";
import { sanitizeProductEvent } from "@/platform/telemetry/events";
import { toPulseAtlasEvent } from "@/platform/telemetry/pulseatlas";

describe("PulseAtlas story telemetry", () => {
  it("maps only sanitized content-blind fields", () => {
    const source = sanitizeProductEvent({ event: "story_exported", product: "threadtales", mode: "friends", messages: "private", participantNames: ["A"] });
    const mapped = toPulseAtlasEvent(source);
    expect(mapped.properties).toEqual({ product: "threadtales", mode: "friends" });
    expect(JSON.stringify(mapped)).not.toContain("private");
    expect(JSON.stringify(mapped)).not.toContain("participantNames");
  });
});
