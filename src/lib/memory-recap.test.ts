import { describe, expect, it } from "vitest";
import {
  composeMemoryRecapPages,
  isMemoryRecapDraft,
  newMemoryRecapDraft,
} from "./memory-recap";

const assets = ["a", "b", "c", "d", "e"].map((id) => ({ id }));

describe("memory recap composition", () => {
  it("keeps full-bleed media one asset per page in stable order", () => {
    expect(composeMemoryRecapPages(assets, "FULL_BLEED").map((page) => page.assetIds)).toEqual([
      ["a"],
      ["b"],
      ["c"],
      ["d"],
      ["e"],
    ]);
  });

  it("groups the same ordered assets without mutating them for split and editorial layouts", () => {
    expect(composeMemoryRecapPages(assets, "SPLIT").map((page) => page.assetIds)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ]);
    expect(composeMemoryRecapPages(assets, "EDITORIAL").map((page) => page.assetIds)).toEqual([
      ["a", "b", "c"],
      ["d", "e"],
    ]);
    expect(assets.map((asset) => asset.id)).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("creates a bounded local draft that can be validated after persistence", () => {
    const draft = newMemoryRecapDraft("space-1", "MEMORY_LANE", new Date("2026-10-07T12:00:00.000Z"));
    expect(draft).toMatchObject({ layout: "FULL_BLEED", playbackMs: 2800 });
    expect(isMemoryRecapDraft(JSON.parse(JSON.stringify(draft)))).toBe(true);
    expect(isMemoryRecapDraft({ ...draft, playbackMs: 200 })).toBe(false);
  });
});
