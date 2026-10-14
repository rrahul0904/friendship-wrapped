import { describe, expect, it } from "vitest";
import {
  createMemorySpaceManifest,
  isMemorySpaceManifest,
  memoryProfileForSlug,
  productTemplateForRelationship,
  subjectTypeForRelationship,
} from "./memory-platform";

describe("ThreadTales memory platform", () => {
  it("keeps consumer memory products, lenses, and progress worlds distinct", () => {
    expect(memoryProfileForSlug("relationship")).toMatchObject({ family: "MEMORY", template: "RELATIONSHIP" });
    expect(memoryProfileForSlug("babystory")).toMatchObject({ family: "MEMORY", template: "BABYSTORY" });
    expect(memoryProfileForSlug("petlife")).toMatchObject({ family: "MEMORY", subjectType: "PET" });
    expect(memoryProfileForSlug("lifemap")).toMatchObject({ family: "LENS", lens: "LIFEMAP" });
    expect(memoryProfileForSlug("myyear")).toMatchObject({ family: "LENS", lens: "MYYEAR" });
    expect(memoryProfileForSlug("founderworld")).toMatchObject({ family: "PROGRESS", progressTemplate: "FOUNDERWORLD" });
    expect(memoryProfileForSlug("creatorworld")).toMatchObject({ family: "PROGRESS", progressTemplate: "CREATORWORLD" });
  });

  it("maps durable subjects without pretending every memory is a person", () => {
    expect(subjectTypeForRelationship("PARTNER")).toBe("RELATIONSHIP");
    expect(subjectTypeForRelationship("CHILD")).toBe("PERSON");
    expect(subjectTypeForRelationship("FAMILY_GROUP")).toBe("FAMILY");
    expect(subjectTypeForRelationship("PET")).toBe("PET");
    expect(subjectTypeForRelationship("HOME")).toBe("HOME");
    expect(subjectTypeForRelationship("SELF")).toBe("SELF");
  });

  it("chooses existing product templates for matching subjects", () => {
    expect(productTemplateForRelationship("PARTNER")).toBe("RELATIONSHIP");
    expect(productTemplateForRelationship("CHILD")).toBe("BABYSTORY");
    expect(productTemplateForRelationship("FRIEND")).toBe("FRIENDSHIP");
    expect(productTemplateForRelationship("PET")).toBe("PETLIFE");
    expect(productTemplateForRelationship("HOME")).toBe("HOMESTORY");
  });

  it("creates a portable versioned MemorySpace manifest", () => {
    const manifest = createMemorySpaceManifest({
      id: "daughter-1",
      name: " My daughter ",
      relationshipType: "CHILD",
      now: new Date("2026-10-06T12:00:00Z"),
    });
    expect(manifest).toMatchObject({
      schemaVersion: 1,
      id: "daughter-1",
      name: "My daughter",
      subjectType: "PERSON",
      productTemplate: "BABYSTORY",
      relationshipType: "CHILD",
      createdAt: "2026-10-06T12:00:00.000Z",
    });
    expect(isMemorySpaceManifest(manifest)).toBe(true);
  });

  it("rejects malformed manifests instead of treating arbitrary local data as a MemorySpace", () => {
    const manifest = createMemorySpaceManifest({ id: "space-1", name: "Partner", relationshipType: "PARTNER" });
    expect(isMemorySpaceManifest({ ...manifest, productTemplate: "NOT_A_TEMPLATE" })).toBe(false);
    expect(isMemorySpaceManifest({ ...manifest, subjectType: "COMPANY" })).toBe(false);
    expect(isMemorySpaceManifest({ ...manifest, relationshipType: "NOT_A_RELATIONSHIP" })).toBe(false);
    expect(isMemorySpaceManifest({ ...manifest, id: "x".repeat(129) })).toBe(false);
    expect(isMemorySpaceManifest({ ...manifest, updatedAt: "not-a-date" })).toBe(false);
  });
});
