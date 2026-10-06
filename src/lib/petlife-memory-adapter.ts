import {
  createDirectMemoryNode,
  createEmptyMemoryGraph,
  legacyProductMemorySpaceId,
  memoryGraphStorageKey,
  type MemoryGraph,
} from "./memory-graph";
import {
  MEMORY_SPACE_INDEX_KEY,
  createMemorySpaceManifest,
  memorySpaceStorageKey,
} from "./memory-platform";
import type { PetMemory, PetProfile } from "@/products/petlife/model";

export const PETLIFE_SHARED_MEMORY_SPACE_ID = legacyProductMemorySpaceId("petlife");

function indexMemorySpace(memorySpaceId: string) {
  try {
    const raw = window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    if (!ids.includes(memorySpaceId)) window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify([...ids, memorySpaceId]));
  } catch {
    window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify([memorySpaceId]));
  }
}

function memoryTimestamp(date: string) {
  const timestamp = Date.parse(`${date}T12:00:00`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function syncPetLifeMemoryGraph(profile: PetProfile | null, memories: readonly PetMemory[]) {
  if (typeof window === "undefined" || !profile) return;
  const memorySpaceId = PETLIFE_SHARED_MEMORY_SPACE_ID;
  const now = new Date();
  const manifest = createMemorySpaceManifest({
    id: memorySpaceId,
    name: profile.name,
    relationshipType: "PET",
    productTemplate: "PETLIFE",
    now,
  });
  const graph: MemoryGraph = createEmptyMemoryGraph(memorySpaceId, now);
  graph.nodes = memories.map((memory) => createDirectMemoryNode({
    id: `${memorySpaceId}:legacy:${memory.id}`,
    memorySpaceId,
    kind: memory.type === "milestone" ? "MILESTONE" : "MANUAL_MEMORY",
    title: memory.title,
    summary: memory.note || `${memory.photoCount} selected photo${memory.photoCount === 1 ? "" : "s"}`,
    occurredAt: memoryTimestamp(memory.date),
    source: "LEGACY_PRODUCT",
    productTemplate: "PETLIFE",
    facts: {
      petId: profile.id,
      species: profile.species,
      memoryType: memory.type,
      memoryDate: memory.date,
      photoCount: memory.photoCount,
    },
    extra: profile.species,
  }, now));
  graph.updatedAt = now.toISOString();

  window.localStorage.setItem(memorySpaceStorageKey(memorySpaceId), JSON.stringify(manifest));
  window.localStorage.setItem(memoryGraphStorageKey(memorySpaceId), JSON.stringify(graph));
  indexMemorySpace(memorySpaceId);
}

export function clearPetLifeMemoryGraph() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(memorySpaceStorageKey(PETLIFE_SHARED_MEMORY_SPACE_ID));
  window.localStorage.removeItem(memoryGraphStorageKey(PETLIFE_SHARED_MEMORY_SPACE_ID));
  try {
    const raw = window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return;
    window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify(parsed.filter((item) => item !== PETLIFE_SHARED_MEMORY_SPACE_ID)));
  } catch {
    // A broken index is not allowed to block deletion of the pet MemorySpace itself.
  }
}
