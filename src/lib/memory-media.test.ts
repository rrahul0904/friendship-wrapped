import { describe, expect, it } from "vitest";
import {
  MAX_LOCAL_MEDIA_BYTES,
  isMemoryStudioDraft,
  mediaKindForType,
  newMemoryStudioDraft,
  studioDraftStorageKey,
  validateMemoryMediaFile,
} from "./memory-media";

describe("Memory Studio media contracts", () => {
  it("accepts image and video files within the local limit", () => {
    expect(validateMemoryMediaFile({ name: "photo.jpg", type: "image/jpeg", size: 2048 })).toBeNull();
    expect(validateMemoryMediaFile({ name: "clip.mp4", type: "video/mp4", size: 4096 })).toBeNull();
    expect(mediaKindForType("image/png")).toBe("IMAGE");
    expect(mediaKindForType("video/quicktime")).toBe("VIDEO");
  });

  it("rejects unsupported, empty, and oversized media", () => {
    expect(validateMemoryMediaFile({ name: "notes.txt", type: "text/plain", size: 20 })).toMatch(/not a supported/i);
    expect(validateMemoryMediaFile({ name: "empty.jpg", type: "image/jpeg", size: 0 })).toMatch(/empty/i);
    expect(validateMemoryMediaFile({ name: "huge.mp4", type: "video/mp4", size: MAX_LOCAL_MEDIA_BYTES + 1 })).toMatch(/100 MB/i);
  });

  it("creates a local-only studio draft with a soundtrack reference boundary", () => {
    const draft = newMemoryStudioDraft("space-1", "ANNIVERSARY", new Date("2026-10-06T00:00:00Z"));
    expect(draft).toMatchObject({
      schemaVersion: 1,
      memorySpaceId: "space-1",
      intent: "ANNIVERSARY",
      dedication: "",
      soundtrack: { mode: "REFERENCE", title: "", artist: "", url: "" },
      updatedAt: "2026-10-06T00:00:00.000Z",
    });
    expect(isMemoryStudioDraft(draft)).toBe(true);
  });

  it("scopes studio state by MemorySpace and intent", () => {
    expect(studioDraftStorageKey("abc", "PROUD_OF_YOU")).toBe("threadtales:memory-studio:v1:abc:PROUD_OF_YOU");
  });
});
