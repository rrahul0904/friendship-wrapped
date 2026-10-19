import type { StoryBeat, StoryBeatSource } from "./memory-story";
import type { MemoryMediaAsset } from "./memory-media";

/**
 * A clean-room, view-only timeline. Media is resolved to browser-only object URLs
 * by the player; URLs, blobs and private text are never serialized or uploaded.
 */
export type BurstFrame =
  | { id: string; kind: "STORY"; title: string; body: string; source: StoryBeatSource }
  | { id: string; kind: "PHOTO" | "VIDEO"; assetId: string; alt: string };

export type BurstMediaInput = Pick<MemoryMediaAsset, "id" | "name" | "kind">;

export function composeBurstFrames(
  beats: readonly StoryBeat[],
  media: readonly BurstMediaInput[],
  dedication: string,
): BurstFrame[] {
  const ownWords = dedication.trim().slice(0, 600);
  const story: BurstFrame[] = beats.map((beat) => ({
    id: `story:${beat.id}`,
    kind: "STORY",
    title: beat.title,
    body: beat.source === "USER_REQUIRED" && ownWords ? ownWords : (beat.body ?? ""),
    source: beat.source,
  }));
  const pictures: BurstFrame[] = media.map((asset) => ({
    id: `media:${asset.id}`,
    kind: asset.kind === "VIDEO" ? "VIDEO" : "PHOTO",
    assetId: asset.id,
    alt: asset.name,
  }));
  // Story opening -> user's media -> approved-memory / occasion chapters.
  return [...story.slice(0, 1), ...pictures, ...story.slice(1)];
}

export function burstFrameDurationMs(frame: BurstFrame): number | null {
  // Videos finish on their own 'ended' event and must not be skipped by a timer.
  if (frame.kind === "VIDEO") return null;
  return frame.kind === "PHOTO" ? 3800 : 5500;
}

export function nextBurstIndex(current: number, count: number): number | null {
  if (!Number.isInteger(current) || !Number.isInteger(count) || count < 1) return null;
  return current >= 0 && current < count - 1 ? current + 1 : null;
}
