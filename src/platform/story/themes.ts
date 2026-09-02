import type { StoryThemeId } from "@/platform/types";

export interface StoryTheme {
  id: StoryThemeId;
  label: string;
  premium: boolean;
  background: readonly [string, string, string];
  surface: string;
  surfaceSoft: string;
  foreground: string;
  accent: string;
  accent2: string;
  heart: string;
  muted: string;
  glow: string;
}

export const STORY_THEMES: Record<StoryThemeId, StoryTheme> = {
  midnight: {
    id: "midnight", label: "Midnight", premium: false,
    background: ["#080A12", "#111426", "#191D32"], surface: "#111426", surfaceSoft: "#191D32",
    foreground: "#F8FAFC", muted: "#9CA3AF", accent: "#A78BFA", accent2: "#38BDF8", heart: "#FB7185", glow: "rgba(167, 139, 250, 0.35)",
  },
  sunset: {
    id: "sunset", label: "Sunset", premium: true,
    background: ["#FFF3E4", "#FFE4C7", "#FFFFFF"], surface: "#FFFFFF", surfaceSoft: "#FFE4C7",
    foreground: "#2B160E", muted: "#8A5A44", accent: "#F97316", accent2: "#EC4899", heart: "#E11D48", glow: "rgba(249, 115, 22, 0.25)",
  },
  paper: {
    id: "paper", label: "Paper", premium: true,
    background: ["#F7F1E8", "#FFFDF8", "#EFE2CF"], surface: "#FFFDF8", surfaceSoft: "#EFE2CF",
    foreground: "#241C15", muted: "#76695D", accent: "#8B5E34", accent2: "#31572C", heart: "#A44A3F", glow: "rgba(139, 94, 52, 0.18)",
  },
  neon: {
    id: "neon", label: "Neon", premium: true,
    background: ["#050008", "#14001E", "#210032"], surface: "#14001E", surfaceSoft: "#210032",
    foreground: "#FFFFFF", muted: "#C084FC", accent: "#F0ABFC", accent2: "#22D3EE", heart: "#FB7185", glow: "rgba(240, 171, 252, 0.45)",
  },
};

export function getStoryTheme(id: StoryThemeId | string | null | undefined) {
  if (id && Object.prototype.hasOwnProperty.call(STORY_THEMES, id)) return STORY_THEMES[id as StoryThemeId];
  return STORY_THEMES.midnight;
}

export function storyThemeBackground(theme: StoryTheme) {
  const [start, middle, end] = theme.background;
  return `linear-gradient(135deg, ${start}, ${middle} 56%, ${end})`;
}
