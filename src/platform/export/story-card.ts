import type { StoryChapter } from "@/platform/types";

export type StoryCardPreset = "vertical" | "square";

const PRESETS: Record<StoryCardPreset, { width: number; height: number }> = {
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function lines(value: string, max = 28) {
  const words = value.split(/\s+/).filter(Boolean);
  const output: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > max && current) {
      output.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) output.push(current);
  return output.slice(0, 4);
}

export function renderStoryCardSvg(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true) {
  const { width, height } = PRESETS[preset];
  const titleLines = lines(chapter.title, preset === "vertical" ? 26 : 32);
  const titleStart = Math.round(height * 0.22);
  const titleSize = preset === "vertical" ? 80 : 64;
  const metricSize = preset === "vertical" ? 150 : 110;
  const metricY = titleStart + titleLines.length * (titleSize + 16) + 100;
  const subtitleY = metricY + (chapter.metric !== undefined ? metricSize + 34 : 20);
  const title = titleLines.map((line, index) => `<text x="${width / 2}" y="${titleStart + index * (titleSize + 16)}" text-anchor="middle" font-size="${titleSize}" font-weight="700" fill="#ffffff">${escapeXml(line)}</text>`).join("");
  const metric = chapter.metric !== undefined ? `<text x="${width / 2}" y="${metricY}" text-anchor="middle" font-size="${metricSize}" font-weight="800" fill="#ffffff">${escapeXml(String(chapter.metric))}</text>` : "";
  const subtitle = chapter.subtitle ? `<text x="${width / 2}" y="${subtitleY}" text-anchor="middle" font-size="38" fill="rgba(255,255,255,.82)">${escapeXml(chapter.subtitle)}</text>` : "";
  const supporting = chapter.supportingText ? `<foreignObject x="${Math.round(width * 0.12)}" y="${subtitleY + 70}" width="${Math.round(width * 0.76)}" height="320"><div xmlns="http://www.w3.org/1999/xhtml" style="font: 34px/1.4 system-ui, sans-serif;color:rgba(255,255,255,.74);text-align:center;">${escapeXml(chapter.supportingText)}</div></foreignObject>` : "";
  const brand = attribution ? `<text x="${width / 2}" y="${height - 70}" text-anchor="middle" font-size="28" letter-spacing="4" fill="rgba(255,255,255,.58)">THREADTALES · PRIVATE BY DEFAULT</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17122b"/><stop offset="0.52" stop-color="#452f74"/><stop offset="1" stop-color="#8a4f8e"/></linearGradient><radialGradient id="glow"><stop offset="0" stop-color="rgba(255,255,255,.18)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient></defs><rect width="100%" height="100%" rx="42" fill="url(#bg)"/><circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.17)}" r="${Math.round(width * 0.45)}" fill="url(#glow)"/><text x="${width / 2}" y="100" text-anchor="middle" font-size="26" letter-spacing="6" fill="rgba(255,255,255,.56)">${escapeXml(chapter.type.toUpperCase())}</text>${title}${metric}${subtitle}${supporting}${brand}</svg>`;
}

export async function downloadStoryCard(chapter: StoryChapter, preset: StoryCardPreset = "vertical", attribution = true) {
  if (typeof document === "undefined") return;
  const { width, height } = PRESETS[preset];
  const svg = renderStoryCardSvg(chapter, preset, attribution);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.decoding = "async";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Could not render the story card."));
    image.src = svgUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas export is not available in this browser.");
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(svgUrl);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not create the image export.")), "image/png", 0.96));
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = `threadtales-${chapter.id}-${preset}.png`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
}
