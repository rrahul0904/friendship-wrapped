import { describe, expect, it } from "vitest";
import { analyzeChat } from "@/lib/analyze";
import { parseChat } from "@/lib/parser";
import { makeSampleChat } from "@/lib/sample";
import { renderStoryCardSvg, STORY_CARD_PRESETS } from "@/platform/export/story-card";
import { composeThreadTale, createStoryShareManifest } from "@/platform/story/compose";
import { STORY_MODES } from "@/platform/story/modes";
import { getStoryTheme, STORY_THEMES } from "@/platform/story/themes";
import type { StoryChapter } from "@/platform/types";

const stats = analyzeChat(parseChat(makeSampleChat(), "auto"));

describe("reverse-engineering story parity", () => {
  it("surfaces the deterministic analytics that were previously missing from story composition", () => {
    const ids = composeThreadTale(stats, "friends").map((chapter) => chapter.id);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(ids).toEqual(expect.arrayContaining(["conversation-starter", "reply-speed", "response-rhythm", "vibe"]));
  });

  it.each(Object.entries(STORY_MODES))("keeps %s deterministic and bounded to useful chapters", (mode, config) => {
    const first = composeThreadTale(stats, config.id);
    const second = composeThreadTale(stats, config.id);
    expect(first.map((chapter) => chapter.id)).toEqual(second.map((chapter) => chapter.id));
    expect(first[0]?.id).toBe("cover");
    expect(first.at(-1)?.id).toBe("closing");
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(first.length).toBeLessThanOrEqual(14);
    expect(mode).toBe(config.id);
  });

  it("keeps participant-bearing conversation starter detail out of the default public manifest", () => {
    const manifest = createStoryShareManifest(stats, "friends");
    expect(manifest.cards.some((card) => card.id === "conversation-starter")).toBe(false);
    expect(createStoryShareManifest(stats, "friends", { includeSensitive: true }).cards.some((card) => card.id === "conversation-starter")).toBe(true);
  });
});

describe("shared story themes and export layouts", () => {
  const chapter: StoryChapter = { id: "theme", type: "vibe", title: "Observable vibe", metric: "72/100", subtitle: "Curious", privacyLevel: "safe", renderVariant: "metric" };

  it("supports the required 9:16, 1:1 and 4:5 export dimensions", () => {
    expect(STORY_CARD_PRESETS.vertical).toEqual({ width: 1080, height: 1920 });
    expect(STORY_CARD_PRESETS.square).toEqual({ width: 1080, height: 1080 });
    expect(STORY_CARD_PRESETS.portrait).toEqual({ width: 1080, height: 1350 });
    expect(renderStoryCardSvg(chapter, "portrait")).toContain('width="1080" height="1350"');
  });

  it.each(Object.values(STORY_THEMES))("drives SVG rendering from theme %s", (theme) => {
    const svg = renderStoryCardSvg(chapter, "square", true, theme.id);
    expect(svg).toContain(theme.background[0]);
    expect(svg).toContain(theme.foreground);
    expect(svg).toContain(theme.accent);
  });

  it("falls back safely when an unknown theme reaches the resolver", () => {
    expect(getStoryTheme("unknown-theme").id).toBe("midnight");
  });
});
