import { describe, expect, it } from "vitest";
import {
  MEMORY_INTENTS,
  isMemorySpaceDraft,
  newMemorySpaceDraft,
  recommendedIntents,
  sourceIntakeHref,
} from "./memory-space";

describe("MemorySpace intent model", () => {
  it("exposes the nine initial product intents", () => {
    expect(MEMORY_INTENTS.map((intent) => intent.kind)).toEqual([
      "MEMORY_LANE",
      "VALENTINE_GIFT",
      "PROM_INVITATION",
      "DATE_INVITATION",
      "APOLOGY",
      "I_LOVE_YOU",
      "ANNIVERSARY",
      "PROUD_OF_YOU",
      "GROUP_MEMORY",
    ]);
  });

  it("recommends relationship-specific intents without creating separate products", () => {
    const childKinds = recommendedIntents("CHILD").map((intent) => intent.kind);
    expect(childKinds).toContain("MEMORY_LANE");
    expect(childKinds).toContain("PROUD_OF_YOU");
    expect(childKinds).not.toContain("VALENTINE_GIFT");

    const groupKinds = recommendedIntents("FAMILY_GROUP").map((intent) => intent.kind);
    expect(groupKinds).toContain("GROUP_MEMORY");
  });

  it("creates a versioned local draft with no selected person, intent, or source", () => {
    const draft = newMemorySpaceDraft("draft-1", new Date("2026-10-05T20:00:00-04:00"));
    expect(draft).toMatchObject({
      schemaVersion: 1,
      id: "draft-1",
      relationshipType: null,
      intent: null,
      source: null,
      step: "RELATIONSHIP",
    });
    expect(isMemorySpaceDraft(draft)).toBe(true);
  });

  it("rejects malformed or future-version drafts", () => {
    expect(isMemorySpaceDraft(null)).toBe(false);
    expect(isMemorySpaceDraft({ schemaVersion: 2 })).toBe(false);
    expect(
      isMemorySpaceDraft({
        schemaVersion: 1,
        id: "x",
        relationshipType: "STRANGER",
        intent: null,
        name: "",
        source: null,
        step: "RELATIONSHIP",
        updatedAt: new Date().toISOString(),
      }),
    ).toBe(false);
  });

  it("routes conversation drafts into the existing local chat analyzer", () => {
    const draft = {
      ...newMemorySpaceDraft("wife-memory"),
      relationshipType: "PARTNER" as const,
      intent: "ANNIVERSARY" as const,
      name: "Our story",
      source: "CONVERSATION" as const,
      step: "SOURCE" as const,
    };
    const href = sourceIntakeHref(draft);
    expect(href).toContain("/create?");
    expect(href).toContain("memorySpaceId=wife-memory");
    expect(href).toContain("intent=ANNIVERSARY");
  });

  it("routes media and manual starts to source-specific memory intake", () => {
    const base = {
      ...newMemorySpaceDraft("daughter-memory"),
      relationshipType: "CHILD" as const,
      intent: "PROUD_OF_YOU" as const,
      name: "My daughter",
      step: "SOURCE" as const,
    };

    expect(sourceIntakeHref({ ...base, source: "PHOTOS_VIDEOS" as const })).toContain("/memory/intake/photos-videos?");
    expect(sourceIntakeHref({ ...base, source: "MANUAL" as const })).toContain("/memory/intake/manual?");
  });
});
