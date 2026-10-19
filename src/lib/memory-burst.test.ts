import { describe, expect, it } from "vitest";
import { burstFrameDurationMs, composeBurstFrames, nextBurstIndex } from "./memory-burst";
import type { StoryBeat } from "./memory-story";

const beats: StoryBeat[] = [
  { id: "opening", kind: "OPENING", title: "Opening", source: "INTENT_COPY" },
  { id: "memory", kind: "MEMORY", title: "Approved memory", body: "A shared moment", memoryNodeId: "approved", source: "MEMORY_NODE" },
  { id: "dedication", kind: "DEDICATION", title: "Your words", body: "Write a message", source: "USER_REQUIRED" },
];

describe("Memory Burst timeline", () => {
  it("composes only approved Story Plan beats and selected local media", () => {
    const frames = composeBurstFrames(beats, [
      { id: "image-1", kind: "IMAGE", name: "beach.png" },
      { id: "video-1", kind: "VIDEO", name: "birthday.mp4" },
    ], "  A message from me.  ");
    expect(frames.map((frame) => frame.kind)).toEqual(["STORY", "PHOTO", "VIDEO", "STORY", "STORY"]);
    expect(frames[3]).toMatchObject({ kind: "STORY", title: "Approved memory", source: "MEMORY_NODE" });
    expect(frames[4]).toMatchObject({ kind: "STORY", body: "A message from me.", source: "USER_REQUIRED" });
    expect(JSON.stringify(frames)).not.toMatch(/blob|objectUrl|https?:\/\//);
  });

  it("never replaces authored or approved memories with dedication", () => {
    const frames = composeBurstFrames(beats, [], "A private dedication");
    expect(frames[1]).toMatchObject({ body: "A shared moment" });
    expect(frames[2]).toMatchObject({ body: "A private dedication" });
  });

  it("makes video advancement event-driven and stops at the final frame", () => {
    expect(burstFrameDurationMs({ id: "photo", kind: "PHOTO", assetId: "p", alt: "p" })).toBe(3800);
    expect(burstFrameDurationMs({ id: "story", kind: "STORY", title: "Hello", body: "", source: "INTENT_COPY" })).toBe(5500);
    expect(burstFrameDurationMs({ id: "video", kind: "VIDEO", assetId: "v", alt: "v" })).toBeNull();
    expect(nextBurstIndex(0, 2)).toBe(1);
    expect(nextBurstIndex(1, 2)).toBeNull();
    expect(nextBurstIndex(-1, 2)).toBeNull();
  });
});
