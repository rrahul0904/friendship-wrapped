import { describe, expect, it } from "vitest";
import { buildMyYearSummary, composeMyYearChapters, createMyYearShareManifest, myYearEvents } from "@/products/myyear/model";
import { buildPetLifeRecap, composePetLifeChapters, createPetLifeShareManifest, petLifeEvents, type PetProfile } from "@/products/petlife/model";

describe("MyYear model", () => {
  const moments = [
    { id: "m3", title: "Autumn", date: "2026-10-10", caption: "PRIVATE_CAPTION_XYZ", location: "PRIVATE_LOCATION_ABC", photoCount: 2 },
    { id: "m1", title: "January start", date: "2026-01-15", caption: "first", location: "Boston", photoCount: 1 },
    { id: "m2", title: "February trip", date: "2026-02-20", caption: "second", location: "New York", photoCount: 3 },
  ];

  it("orders moments, groups months, and creates deterministic consecutive eras", () => {
    const summary = buildMyYearSummary(2026, "My year", moments);
    expect(summary.moments.map((moment) => moment.id)).toEqual(["m1", "m2", "m3"]);
    expect(summary.monthlyCounts[0].moments).toBe(1);
    expect(summary.monthlyCounts[1].moments).toBe(1);
    expect(summary.monthlyCounts[9].moments).toBe(1);
    expect(summary.eras).toEqual([
      { id: "era-1", label: "Jan–Feb", startMonth: 0, endMonth: 1, moments: 2 },
      { id: "era-2", label: "Oct", startMonth: 9, endMonth: 9, moments: 1 },
    ]);
    expect(summary.photoCount).toBe(6);
  });

  it("rejects moments outside the selected year", () => {
    expect(() => buildMyYearSummary(2026, "", [{ id: "x", title: "wrong year", date: "2025-12-31", photoCount: 0 }])).toThrow(/outside 2026/);
  });

  it("keeps captions, locations and file-like private data out of the public manifest", () => {
    const summary = buildMyYearSummary(2026, "A safe title", moments);
    const manifest = createMyYearShareManifest(summary);
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toContain("PRIVATE_CAPTION_XYZ");
    expect(serialized).not.toContain("PRIVATE_LOCATION_ABC");
    expect(serialized).not.toContain("PRIVATE_FILENAME_123");
    expect(serialized).not.toContain("photoBytes");
    expect(manifest.momentCount).toBe(3);
    expect(manifest.photoCount).toBe(6);
  });

  it("keeps private moment chapters sensitive while deterministic recap chapters remain stable", () => {
    const summary = buildMyYearSummary(2026, "My year", moments);
    const chapters = composeMyYearChapters(summary);
    expect(chapters[0].id).toBe("myyear-cover");
    expect(chapters.at(-1)?.id).toBe("myyear-closing");
    expect(chapters.filter((chapter) => chapter.id.startsWith("myyear-m")).every((chapter) => chapter.privacyLevel === "sensitive")).toBe(true);
    expect(composeMyYearChapters(summary).map((chapter) => chapter.id)).toEqual(chapters.map((chapter) => chapter.id));
    expect(myYearEvents(summary)[0].occurredAt).toContain("2026-01-15");
  });

  it("supports an empty year summary without AI", () => {
    const summary = buildMyYearSummary(2026, "", []);
    expect(summary.title).toBe("My 2026");
    expect(summary.moments).toEqual([]);
    expect(summary.eras).toEqual([]);
    expect(composeMyYearChapters(summary).at(-1)?.id).toBe("myyear-closing");
  });
});

describe("PetLife model", () => {
  const profile: PetProfile = { id: "11111111-1111-4111-8111-111111111111", name: "Milo", species: "Dog" };
  const memories = [
    { id: "3", petId: profile.id, type: "memory" as const, date: "2026-12-01", title: "Winter walk", note: "PRIVATE_VET_NOTE", photoCount: 1 },
    { id: "1", petId: profile.id, type: "milestone" as const, date: "2026-02-03", title: "First snow", note: "PRIVATE_MEMORY_NOTE", photoCount: 2 },
    { id: "2", petId: profile.id, type: "memory" as const, date: "2026-03-05", title: "Park day", note: "ordinary note", photoCount: 3 },
    { id: "old", petId: profile.id, type: "memory" as const, date: "2025-05-01", title: "Old year", photoCount: 9 },
  ];

  it("filters by pet and year, sorts chronologically, and counts milestones", () => {
    const recap = buildPetLifeRecap(profile, memories, 2026);
    expect(recap.memories.map((memory) => memory.id)).toEqual(["1", "2", "3"]);
    expect(recap.milestoneCount).toBe(1);
    expect(recap.photoCount).toBe(6);
    expect(recap.monthlyCounts[1].memories).toBe(1);
    expect(recap.monthlyCounts[2].memories).toBe(1);
    expect(recap.monthlyCounts[11].memories).toBe(1);
  });

  it("keeps notes and media metadata out of the default public recap", () => {
    const recap = buildPetLifeRecap(profile, memories, 2026);
    const manifest = createPetLifeShareManifest(recap);
    const serialized = JSON.stringify(manifest);
    expect(manifest.petName).toBeUndefined();
    expect(serialized).not.toContain("PRIVATE_VET_NOTE");
    expect(serialized).not.toContain("PRIVATE_MEMORY_NOTE");
    expect(serialized).not.toContain("SECRET_PHOTO_FILENAME");
    expect(serialized).not.toContain("note");
    expect(createPetLifeShareManifest(recap, true).petName).toBe("Milo");
  });

  it("marks individual memory chapters sensitive and keeps annual recap stable", () => {
    const recap = buildPetLifeRecap(profile, memories, 2026);
    const chapters = composePetLifeChapters(recap);
    expect(chapters[0].id).toBe("pet-cover");
    expect(chapters.at(-1)?.id).toBe("pet-closing");
    expect(chapters.filter((chapter) => chapter.id.startsWith("pet-1") || chapter.id.startsWith("pet-2") || chapter.id.startsWith("pet-3")).every((chapter) => chapter.privacyLevel === "sensitive")).toBe(true);
    expect(petLifeEvents(recap).map((event) => event.id)).toEqual(["1", "2", "3"]);
  });
});
