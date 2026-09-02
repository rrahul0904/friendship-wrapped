import { describe, expect, it } from "vitest";
import { mediaMetadataOnly, type LocalMediaAsset } from "@/platform/media/local";
import { buildPetLifeRecap, composePetLifeMemorialChapters, createPetLifeShareManifest, type PetProfile } from "@/products/petlife/model";

describe("shared local media boundary", () => {
  it("strips browser object URLs from metadata-only representations", () => {
    const asset: LocalMediaAsset = { id: "1", name: "PRIVATE_FILENAME.jpg", type: "image/jpeg", size: 123, lastModified: 456, objectUrl: "blob:PRIVATE_IMAGE_BYTES_REFERENCE" };
    const serialized = JSON.stringify(mediaMetadataOnly([asset]));
    expect(serialized).toContain("PRIVATE_FILENAME.jpg");
    expect(serialized).not.toContain("blob:");
    expect(serialized).not.toContain("PRIVATE_IMAGE_BYTES_REFERENCE");
  });
});

describe("PetLife memorial mode", () => {
  const profile: PetProfile = { id: "11111111-1111-4111-8111-111111111111", name: "Milo", species: "Dog" };
  const recap = buildPetLifeRecap(profile, [{ id: "m1", petId: profile.id, type: "memory", date: "2026-06-01", title: "Beach day", note: "PRIVATE_NOTE", photoCount: 1 }], 2026);

  it("changes presentation only after an explicit memorial-mode composition call", () => {
    const chapters = composePetLifeMemorialChapters(recap);
    expect(chapters[0]?.title).toBe("Remembering Milo");
    expect(chapters.at(-1)?.title).toBe("A story worth keeping.");
    expect(chapters.at(-1)?.supportingText).toMatch(/does not infer/i);
  });

  it("does not add memorial state or private notes to the public recap manifest", () => {
    const serialized = JSON.stringify(createPetLifeShareManifest(recap));
    expect(serialized).not.toContain("memorial");
    expect(serialized).not.toContain("PRIVATE_NOTE");
    expect(serialized).not.toContain("Milo");
  });
});
