import type { MemoryIntentKind } from "./memory-space";
import type { MemoryMediaAsset } from "./memory-media";

export type MemoryRecapLayout = "FULL_BLEED" | "SPLIT" | "EDITORIAL";

export interface MemoryRecapPage {
  schemaVersion: 1;
  id: string;
  layout: MemoryRecapLayout;
  assetIds: string[];
}

export interface MemoryRecapDraft {
  schemaVersion: 1;
  memorySpaceId: string;
  intent: MemoryIntentKind;
  layout: MemoryRecapLayout;
  playbackMs: number;
  updatedAt: string;
}

export const MEMORY_RECAP_LAYOUTS: Array<{
  id: MemoryRecapLayout;
  label: string;
  description: string;
  capacity: number;
}> = [
  { id: "FULL_BLEED", label: "Cinematic", description: "One memory fills each page.", capacity: 1 },
  { id: "SPLIT", label: "Split", description: "Two memories share a clean page.", capacity: 2 },
  { id: "EDITORIAL", label: "Editorial", description: "Up to three memories form one composed page.", capacity: 3 },
];

const LAYOUT_CAPACITY: Record<MemoryRecapLayout, number> = {
  FULL_BLEED: 1,
  SPLIT: 2,
  EDITORIAL: 3,
};

export function isMemoryRecapLayout(value: unknown): value is MemoryRecapLayout {
  return value === "FULL_BLEED" || value === "SPLIT" || value === "EDITORIAL";
}

export function memoryRecapDraftStorageKey(memorySpaceId: string, intent: MemoryIntentKind) {
  return `threadtales:memory-recap:v1:${memorySpaceId}:${intent}`;
}

export function newMemoryRecapDraft(
  memorySpaceId: string,
  intent: MemoryIntentKind,
  now = new Date(),
): MemoryRecapDraft {
  return {
    schemaVersion: 1,
    memorySpaceId,
    intent,
    layout: "FULL_BLEED",
    playbackMs: 2800,
    updatedAt: now.toISOString(),
  };
}

export function isMemoryRecapDraft(value: unknown): value is MemoryRecapDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<MemoryRecapDraft>;
  return (
    draft.schemaVersion === 1 &&
    typeof draft.memorySpaceId === "string" &&
    typeof draft.intent === "string" &&
    isMemoryRecapLayout(draft.layout) &&
    typeof draft.playbackMs === "number" &&
    draft.playbackMs >= 1200 &&
    draft.playbackMs <= 10000 &&
    typeof draft.updatedAt === "string"
  );
}

export function composeMemoryRecapPages(
  assets: Array<Pick<MemoryMediaAsset, "id">>,
  layout: MemoryRecapLayout,
): MemoryRecapPage[] {
  const capacity = LAYOUT_CAPACITY[layout];
  const pages: MemoryRecapPage[] = [];
  for (let index = 0; index < assets.length; index += capacity) {
    const assetIds = assets.slice(index, index + capacity).map((asset) => asset.id);
    pages.push({
      schemaVersion: 1,
      id: `recap-${layout.toLowerCase()}-${assetIds.join("--")}`,
      layout,
      assetIds,
    });
  }
  return pages;
}
