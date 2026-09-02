import type { StoryChapter, StoryThemeId } from "@/platform/types";
import { getStoryTheme } from "@/platform/story/themes";

export type StoryCardPreset = "vertical" | "square" | "portrait";

export const STORY_CARD_PRESETS: Record<StoryCardPreset, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character] ?? character);
}

function lines(value: string, max = 28) {
  const words = value.split(/\s+/).filter(Boolean);
  const output: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > max && current) { output.push(current); current = word; }
    else current = `${current} ${word}`.trim();
  }
  if (current) output.push(current);
  return output.slice(0, 4);
}

export function renderStoryCardSvg(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true, themeId: StoryThemeId = "midnight") {
  const { width, height } = STORY_CARD_PRESETS[preset];
  const theme = getStoryTheme(themeId);
  const titleLines = lines(chapter.title, preset === "vertical" ? 26 : 32);
  const titleStart = Math.round(height * 0.22);
  const titleSize = preset === "vertical" ? 80 : 64;
  const metricSize = preset === "vertical" ? 150 : 110;
  const metricY = titleStart + titleLines.length * (titleSize + 16) + 100;
  const subtitleY = metricY + (chapter.metric !== undefined ? metricSize + 34 : 20);
  const title = titleLines.map((line, index) => `<text x="${width / 2}" y="${titleStart + index * (titleSize + 16)}" text-anchor="middle" font-size="${titleSize}" font-weight="700" fill="${theme.foreground}">${escapeXml(line)}</text>`).join("");
  const metric = chapter.metric !== undefined ? `<text x="${width / 2}" y="${metricY}" text-anchor="middle" font-size="${metricSize}" font-weight="800" fill="${theme.foreground}">${escapeXml(String(chapter.metric))}</text>` : "";
  const subtitle = chapter.subtitle ? `<text x="${width / 2}" y="${subtitleY}" text-anchor="middle" font-size="38" fill="${theme.muted}">${escapeXml(chapter.subtitle)}</text>` : "";
  const supporting = chapter.supportingText ? `<foreignObject x="${Math.round(width * 0.12)}" y="${subtitleY + 70}" width="${Math.round(width * 0.76)}" height="320"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 34px/1.4 system-ui, sans-serif;color:${theme.muted};text-align:center;">${escapeXml(chapter.supportingText)}</div></foreignObject>` : "";
  const brand = attribution ? `<text x="${width / 2}" y="${height - 70}" text-anchor="middle" font-size="28" letter-spacing="4" fill="${theme.muted}">THREADTALES · PRIVATE BY DEFAULT</text>` : "";
  const [start, middle, end] = theme.background;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${start}"/><stop offset="0.52" stop-color="${middle}"/><stop offset="1" stop-color="${end}"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="${theme.accent}" stop-opacity=".22"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" rx="42" fill="url(#bg)"/><circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.17)}" r="${Math.round(width * 0.45)}" fill="url(#glow)"/><text x="${width / 2}" y="100" text-anchor="middle" font-size="26" letter-spacing="6" fill="${theme.muted}">${escapeXml(chapter.type.toUpperCase())}</text>${title}${metric}${subtitle}${supporting}${brand}</svg>`;
}

export async function renderStoryCardBlob(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true, themeId: StoryThemeId = "midnight") {
  if (typeof document === "undefined") throw new Error("Story-card rendering requires a browser.");
  const { width, height } = STORY_CARD_PRESETS[preset];
  const svg = renderStoryCardSvg(chapter, preset, attribution, themeId);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.decoding = "async";
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Could not render the story card.")); image.src = svgUrl; });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas export is not available in this browser.");
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not create the image export.")), "image/png", 0.96));
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadStoryCard(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true, themeId: StoryThemeId = "midnight") {
  const blob = await renderStoryCardBlob(chapter, preset, attribution, themeId);
  downloadBlob(blob, `threadtales-${chapter.id}-${preset}.png`);
}

export async function shareStoryCard(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true, themeId: StoryThemeId = "midnight") {
  const blob = await renderStoryCardBlob(chapter, preset, attribution, themeId);
  const file = new File([blob], `threadtales-${chapter.id}-${preset}.png`, { type: "image/png" });
  if (typeof navigator.share !== "function" || (typeof navigator.canShare === "function" && !navigator.canShare({ files: [file] }))) return false;
  try {
    await navigator.share({ title: "ThreadTales", text: "A private chat story made with ThreadTales.", files: [file] });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return true;
    throw error;
  }
}

export async function downloadStorySet(chapters: StoryChapter[], preset: StoryCardPreset = "vertical", attribution = true, themeId: StoryThemeId = "midnight", includeSensitive = false) {
  const selected = chapters.filter((chapter) => includeSensitive || chapter.privacyLevel === "safe");
  for (let index = 0; index < selected.length; index += 1) {
    const chapter = selected[index];
    const blob = await renderStoryCardBlob(chapter, preset, attribution, themeId);
    downloadBlob(blob, `threadtales-${String(index + 1).padStart(2, "0")}-${chapter.id}-${preset}.png`);
    await new Promise((resolve) => window.setTimeout(resolve, 80));
  }
  return selected.length;
}
