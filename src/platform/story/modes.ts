import type { StoryMode } from "@/lib/types";
import type { StoryModeConfig, StoryThemeId } from "@/platform/types";

const DEFAULT_PRIORITY: StoryModeConfig["chapterPriority"] = [
  "cover", "beginning", "scale", "balance", "conversation-starter", "reply-speed", "response-rhythm", "streak", "busiest-day", "late-night", "language", "vibe", "timeline", "closing",
];

function config(id: StoryMode, label: string, eyebrow: string, ending: string, noun: string, theme: StoryThemeId, seoTitle: string, seoDescription: string, chapterPriority: StoryModeConfig["chapterPriority"] = DEFAULT_PRIORITY): StoryModeConfig {
  return { id, label, eyebrow, ending, noun, theme, chapterPriority, recommendedExports: ["vertical", "square", "portrait", "print"], seoTitle, seoDescription };
}

export const STORY_MODES: Record<StoryMode, StoryModeConfig> = {
  friends: config("friends", "Best friends", "Your friendship story", "Still talking.", "friendship", "midnight", "Best Friend Chat Story | ThreadTales", "Turn a private chat export into a shareable best-friend story."),
  couple: config("couple", "Couple", "Your relationship story", "Still choosing each other.", "relationship", "sunset", "Couple Chat Story | ThreadTales", "Turn your relationship chat history into a private, shareable story."),
  siblings: config("siblings", "Siblings", "Your sibling lore", "A lifetime of side quests.", "sibling story", "paper", "Sibling Chat Story | ThreadTales", "Turn sibling chat chaos into a story worth keeping."),
  family: config("family", "Family", "Your family story", "The family chat has receipts.", "family story", "paper", "Family Chat Story | ThreadTales", "Create a privacy-first story from your family chat history."),
  group: config("group", "Group chat", "Your group-chat history", "The lore is extensive.", "group chat", "neon", "Group Chat Wrapped | ThreadTales", "See the history, streaks and chaos inside your group chat."),
  birthday: config("birthday", "Birthday", "A birthday time capsule", "Another year, same favorite person.", "birthday story", "sunset", "Birthday Friendship Story | ThreadTales", "Make a birthday story from years of private chat history.", ["cover", "beginning", "scale", "conversation-starter", "reply-speed", "streak", "language", "vibe", "busiest-day", "timeline", "closing"]),
  anniversary: config("anniversary", "Anniversary", "Your anniversary story", "Look how far this conversation travelled.", "anniversary story", "sunset", "Anniversary Chat Story | ThreadTales", "Turn relationship messages into a private anniversary recap.", ["cover", "beginning", "scale", "balance", "reply-speed", "response-rhythm", "streak", "timeline", "language", "vibe", "closing"]),
  "long-distance": config("long-distance", "Long distance", "Miles apart. Still in the same chat.", "Distance never stopped the conversation.", "long-distance story", "midnight", "Long Distance Relationship Story | ThreadTales", "Create a long-distance relationship story from your private chat history.", ["cover", "scale", "late-night", "reply-speed", "response-rhythm", "streak", "balance", "vibe", "timeline", "closing"]),
  graduation: config("graduation", "Graduation / group", "The group-chat era", "Class dismissed. Lore retained.", "graduation story", "neon", "Graduation Group Chat Story | ThreadTales", "Turn a school or college group chat into a graduation recap.", ["cover", "beginning", "scale", "conversation-starter", "busiest-day", "language", "vibe", "timeline", "closing"]),
  "year-together": config("year-together", "Year together", "This year in messages", "One year. Thousands of tiny check-ins.", "year-together story", "paper", "Year Together Chat Recap | ThreadTales", "Create a private year-together recap from your chat export.", ["cover", "scale", "balance", "reply-speed", "busiest-day", "late-night", "language", "vibe", "timeline", "closing"]),
};

export const OCCASION_MODES: StoryMode[] = ["birthday", "anniversary", "long-distance", "graduation", "year-together"];

export function getStoryModeConfig(mode: StoryMode) { return STORY_MODES[mode] ?? STORY_MODES.friends; }
export function isStoryMode(value: string | null | undefined): value is StoryMode { return Boolean(value && Object.prototype.hasOwnProperty.call(STORY_MODES, value)); }
