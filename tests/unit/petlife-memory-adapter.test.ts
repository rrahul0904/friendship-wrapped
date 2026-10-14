import { afterEach, describe, expect, it } from "vitest";
import { createDirectMemoryNode, createEmptyMemoryGraph, memoryGraphStorageKey } from "../../src/lib/memory-graph";
import { MEMORY_SPACE_INDEX_KEY, memorySpaceStorageKey } from "../../src/lib/memory-platform";
import { clearPetLifeMemoryGraph, PETLIFE_SHARED_MEMORY_SPACE_ID, syncPetLifeMemoryGraph } from "../../src/lib/petlife-memory-adapter";

const localValues = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => localValues.get(key) ?? null,
  setItem: (key: string, value: string) => localValues.set(key, value),
  removeItem: (key: string) => localValues.delete(key),
};

afterEach(() => {
  localValues.clear();
  Reflect.deleteProperty(globalThis, "window");
});

function installWindow() {
  Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: localStorageMock } });
}

describe("PetLife Memory Graph bridge", () => {
  it("replaces PetLife mirror nodes while preserving independently approved memories", () => {
    installWindow();
    const memorySpaceId = PETLIFE_SHARED_MEMORY_SPACE_ID;
    const graph = createEmptyMemoryGraph(memorySpaceId);
    const manual = createDirectMemoryNode({
      id: "my-approved-memory",
      memorySpaceId,
      kind: "MANUAL_MEMORY",
      title: "A memory I added myself",
      source: "MANUAL",
    });
    localStorageMock.setItem(memoryGraphStorageKey(memorySpaceId), JSON.stringify({ ...graph, nodes: [manual] }));

    expect(syncPetLifeMemoryGraph(
      { id: "pet-1", name: "Mochi", species: "Cat" },
      [{ id: "pet-event-1", petId: "pet-1", type: "memory", date: "2026-05-02", title: "Sunny window nap", photoCount: 0 }],
    )).toBe("synced");

    const synced = JSON.parse(localStorageMock.getItem(memoryGraphStorageKey(memorySpaceId)) ?? "{}") as { nodes: Array<{ id: string; title: string }> };
    expect(synced.nodes.map((node) => node.id)).toContain(manual.id);
    expect(synced.nodes.map((node) => node.title)).toContain("A memory I added myself");
    expect(synced.nodes.map((node) => node.title)).toContain("Sunny window nap");

    expect(clearPetLifeMemoryGraph()).toBe("preserved");
    const afterClear = JSON.parse(localStorageMock.getItem(memoryGraphStorageKey(memorySpaceId)) ?? "{}") as { nodes: Array<{ id: string }> };
    expect(afterClear.nodes.map((node) => node.id)).toEqual([manual.id]);
    expect(localStorageMock.getItem(memorySpaceStorageKey(memorySpaceId))).not.toBeNull();
    expect(JSON.parse(localStorageMock.getItem(MEMORY_SPACE_INDEX_KEY) ?? "[]")).toContain(memorySpaceId);
  });

  it("does not overwrite an unreadable graph before user-directed recovery", () => {
    installWindow();
    const corrupt = JSON.stringify({ schemaVersion: 1, memorySpaceId: PETLIFE_SHARED_MEMORY_SPACE_ID, nodes: [{ kind: "BROKEN" }] });
    localStorageMock.setItem(memoryGraphStorageKey(PETLIFE_SHARED_MEMORY_SPACE_ID), corrupt);

    expect(syncPetLifeMemoryGraph({ id: "pet-1", name: "Mochi", species: "Cat" }, [])).toBe("recovery-needed");
    expect(clearPetLifeMemoryGraph()).toBe("recovery-needed");

    expect(localStorageMock.getItem(memoryGraphStorageKey(PETLIFE_SHARED_MEMORY_SPACE_ID))).toBe(corrupt);
  });
});
