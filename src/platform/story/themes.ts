import type { StoryThemeId } from "@/platform/types";

export interface StoryTheme {
  id: StoryThemeId;
  label: string;
  premium: boolean;
  background: readonly [string, string, string];
  surface: string;
  foreground: string;
  accent: string;
  muted: string;
}

export const STORY_THEMES: Record<StoryThemeId, StoryTheme> = {
  midnight: { id: "midnight", label: "Midnight", premium: false, background: ["#17122b", "#452f74", "#8a4f8e"], surface: "rgba(255,255,255,.09)", foreground: "#ffffff", accent: "#d7b8ff", muted: "rgba(255,255,255,.74)" },
  sunset: { id: "sunset", label: "Sunset", premium: true, background: ["#3b173f", "#b43c68", "#f29a5b"], surface: "rgba(255,255,255,.12)", foreground: "#fffaf7", accent: "#ffd7a8", muted: "rgba(255,250,247,.76)" },
  paper: { id: "paper", label: "Paper", premium: true, background: ["#f5efe4", "#eee1cb", "#d9c6a7"], surface: "rgba(255,255,255,.42)", foreground: "#2b241c", accent: "#7c5332", muted: "rgba(43,36,28,.68)" },
  neon: { id: "neon", label: "Neon", premium: true, background: ["#07131d", "#0c3d49", "#46226f"], surface: "rgba(54,255,211,.09)", foreground: "#f7fffd", accent: "#36ffd3", muted: "rgba(247,255,253,.72)" },
};

export function getStoryTheme(id: StoryThemeId | string | null | undefined) { if (id && Object.prototype.hasOwnProperty.call(STORY_THEMES, id)) return STORY_THEMES[id as StoryThemeId]; return STORY_THEMES.midnight; }
export function storyThemeBackground(theme: StoryTheme) { const [start, middle, end] = theme.background; return `linear-gradient(135deg, ${start}, ${middle} 56%, ${end})`; }
