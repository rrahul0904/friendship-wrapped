import { describe, expect, it } from "vitest";
import { analyzeChat } from "@/lib/analyze";
import type { ChatMessage, StoryMode } from "@/lib/types";
import { renderStoryCardSvg } from "@/platform/export/story-card";
import { buildThreadTaleBookSpec, validatePrintSettings } from "@/platform/print/threadtales-book";
import { composeThreadTale, createStoryShareManifest } from "@/platform/story/compose";
import { STORY_MODES } from "@/platform/story/modes";
import { isThreadTaleResultV2, toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import type { StoryChapter } from "@/platform/types";

function at(day: number, hour: number, minute: number) {
  return new Date(2026, 0, day, hour, minute).getTime();
}

const messages: ChatMessage[] = [
  { sender: "SECRET_PERSON_ALPHA", timestamp: at(1, 9, 0), text: "PRIVATE_INSIDE_WORD hello" },
  { sender: "SECRET_PERSON_BETA", timestamp: at(1, 9, 5), text: "hello back" },
  { sender: "SECRET_PERSON_ALPHA", timestamp: at(2, 23, 30), text: "PRIVATE_INSIDE_WORD again" },
  { sender: "SECRET_PERSON_BETA", timestamp: at(3, 0, 10), text: "haha ❤️" },
  { sender: "SECRET_PERSON_ALPHA", timestamp: at(4, 12, 0), text: "last one?" },
];

const stats = analyzeChat(messages);
const modes = Object.keys(STORY_MODES) as StoryMode[];

describe("ThreadTale Result V2", () => {
  it("converts derived analytics into a versioned monthly result", () => {
    const result = toThreadTaleResultV2(stats);
    expect(result.schemaVersion).toBe(2);
    expect(result.source).toBe("whatsapp");
    expect(result.range.start).toBe(new Date(stats.firstTimestamp).toISOString());
    expect(result.range.end).toBe(new Date(stats.lastTimestamp).toISOString());
    expect(result.timeline).toEqual(stats.byMonth.map((point) => ({ key: point.month, label: point.month, messages: point.messages })));
    expect(result.metrics.totalMessages).toBe(stats.totalMessages);
    expect(isThreadTaleResultV2(result)).toBe(true);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_INSIDE_WORD");
  });

  it("rejects incomplete result shapes", () => {
    expect(isThreadTaleResultV2({ schemaVersion: 2 })).toBe(false);
    expect(isThreadTaleResultV2({ schemaVersion: 1, range: {}, participants: [], timeline: [] })).toBe(false);
    expect(isThreadTaleResultV2(null)).toBe(false);
  });
});

describe("deterministic story modes and privacy", () => {
  it.each(modes)("composes stable chapters for %s", (mode) => {
    const first = composeThreadTale(stats, mode);
    const second = composeThreadTale(stats, mode);
    expect(first.map((chapter) => chapter.id)).toEqual(second.map((chapter) => chapter.id));
    expect(first[0]?.id).toBe("cover");
    expect(first.at(-1)?.id).toBe("closing");
    expect(STORY_MODES[mode].id).toBe(mode);
  });

  it("keeps names, top words, and raw content out of the default share manifest", () => {
    const manifest = createStoryShareManifest(stats, "friends");
    const serialized = JSON.stringify(manifest);
    expect(serialized).not.toContain("SECRET_PERSON_ALPHA");
    expect(serialized).not.toContain("SECRET_PERSON_BETA");
    expect(serialized).not.toContain("PRIVATE_INSIDE_WORD");
    expect(serialized).not.toContain("sender");
    expect(serialized).not.toContain("transcript");
    expect(composeThreadTale(stats, "friends").some((chapter) => chapter.privacyLevel === "sensitive")).toBe(true);
    expect(manifest.cards.length).toBeLessThan(composeThreadTale(stats, "friends").length);
  });

  it("only includes sensitive cards when explicitly requested", () => {
    const safe = createStoryShareManifest(stats, "friends");
    const optedIn = createStoryShareManifest(stats, "friends", { includeSensitive: true });
    expect(optedIn.cards.length).toBeGreaterThan(safe.cards.length);
    expect(JSON.stringify(optedIn)).toContain("SECRET_PERSON_ALPHA");
  });
});

describe("story export", () => {
  const chapter: StoryChapter = {
    id: "escape",
    type: "closing",
    title: "A < B & C",
    subtitle: "\"quoted\" 'subtitle'",
    supportingText: "support <private> & safe",
    privacyLevel: "safe",
    renderVariant: "closing",
  };

  it("renders exact vertical and square dimensions", () => {
    const vertical = renderStoryCardSvg(chapter, "vertical");
    const square = renderStoryCardSvg(chapter, "square");
    expect(vertical).toContain('width="1080" height="1920"');
    expect(vertical).toContain('viewBox="0 0 1080 1920"');
    expect(square).toContain('width="1080" height="1080"');
    expect(square).toContain('viewBox="0 0 1080 1080"');
  });

  it("escapes user-facing SVG text and supports attribution removal", () => {
    const svg = renderStoryCardSvg(chapter, "vertical", false);
    expect(svg).toContain("A &lt; B &amp; C");
    expect(svg).toContain("&quot;quoted&quot; &apos;subtitle&apos;");
    expect(svg).toContain("support &lt;private&gt; &amp; safe");
    expect(svg).not.toContain("THREADTALES · PRIVATE BY DEFAULT");
  });
});

describe("keepsake model", () => {
  it("supports 6x9 and 8x10 with bounded bleed", () => {
    expect(buildThreadTaleBookSpec(stats, "friends").trimSize).toBe("6x9");
    expect(buildThreadTaleBookSpec(stats, "friends", { trimSize: "8x10" }).trimSize).toBe("8x10");
    expect(validatePrintSettings("6x9", 0.25)).toMatchObject({ width: 6, height: 9, bleed: 0.25 });
    expect(() => validatePrintSettings("6x9", -0.01)).toThrow(/Bleed/);
    expect(() => validatePrintSettings("8x10", 0.26)).toThrow(/Bleed/);
  });

  it("creates cover, dedication, timeline and ending pages without raw chat text", () => {
    const book = buildThreadTaleBookSpec(stats, "friends", {
      title: "A keepsake",
      dedication: "For the people who kept showing up.",
    });
    expect(book.cover.title).toBe("A keepsake");
    expect(book.pages.some((page) => page.kind === "dedication")).toBe(true);
    expect(book.pages.some((page) => page.kind === "timeline")).toBe(true);
    expect(book.pages.some((page) => page.kind === "ending")).toBe(true);
    expect(JSON.stringify(book)).not.toContain("PRIVATE_INSIDE_WORD");
  });

  it("bounds dedication and cover title lengths", () => {
    const book = buildThreadTaleBookSpec(stats, "friends", { title: "T".repeat(300), dedication: "D".repeat(2000) });
    expect(book.cover.title).toHaveLength(160);
    expect(book.pages.find((page) => page.kind === "dedication")?.body).toHaveLength(1200);
  });
});
