import type { ChatStats, StoryMode } from "@/lib/types";
import type { PrintBookSpec } from "@/platform/types";
import { composeThreadTale } from "@/platform/story/compose";
import { getStoryModeConfig } from "@/platform/story/modes";

const PRINT_SPECS = { "6x9": { width: 6, height: 9, maxBleed: 0.25 }, "8x10": { width: 8, height: 10, maxBleed: 0.25 } } as const;

export function buildThreadTaleBookSpec(stats: ChatStats, mode: StoryMode, options: { title?: string; subtitle?: string; dedication?: string; trimSize?: PrintBookSpec["trimSize"]; bleed?: number } = {}): PrintBookSpec {
  const trimSize = options.trimSize ?? "6x9"; const bleed = options.bleed ?? 0.125; validatePrintSettings(trimSize, bleed); const config = getStoryModeConfig(mode); const chapters = composeThreadTale(stats, mode); const pages: PrintBookSpec["pages"] = [];
  if (options.dedication?.trim()) pages.push({ id: "dedication", kind: "dedication", title: "For you", body: options.dedication.trim().slice(0, 1200) });
  for (const chapter of chapters) pages.push({ id: chapter.id, kind: chapter.type === "cover" ? "cover" : chapter.type === "timeline" ? "timeline" : chapter.type === "closing" ? "ending" : "chapter", title: chapter.title, body: chapter.supportingText, metric: chapter.metric });
  return { trimSize, bleed, cover: { title: (options.title?.trim() || config.eyebrow).slice(0, 160), subtitle: (options.subtitle?.trim() || `${stats.totalMessages.toLocaleString()} messages · ${stats.daysTogether.toLocaleString()} days`).slice(0, 220) }, pages };
}

export function validatePrintSettings(trimSize: PrintBookSpec["trimSize"], bleed: number) { const spec = PRINT_SPECS[trimSize]; if (!spec) throw new Error("Unsupported print trim size."); if (!Number.isFinite(bleed) || bleed < 0 || bleed > spec.maxBleed) throw new Error(`Bleed must be between 0 and ${spec.maxBleed} inches.`); return { ...spec, bleed }; }
