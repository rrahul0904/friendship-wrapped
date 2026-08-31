import type { ChatStats, StoryMode } from "@/lib/types";
import type { StoryChapter, ThreadTaleShareManifest } from "@/platform/types";
import { getStoryModeConfig } from "./modes";

function number(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function date(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function hour(value: number) {
  const suffix = value >= 12 ? "pm" : "am";
  return `${value % 12 || 12}:00${suffix}`;
}

function makeChapter(type: StoryChapter["type"], stats: ChatStats, mode: StoryMode): StoryChapter | null {
  const config = getStoryModeConfig(mode);
  const people = stats.participants.slice(0, 2).map((participant) => participant.name).join(" + ");

  switch (type) {
    case "cover":
      return {
        id: "cover",
        type,
        title: config.eyebrow,
        subtitle: people || "A ThreadTale",
        supportingText: `${number(stats.daysTogether)} days of conversation`,
        privacyLevel: "safe",
        renderVariant: "hero",
      };
    case "beginning":
      return {
        id: "beginning",
        type,
        title: "This story starts here.",
        metric: date(stats.firstTimestamp),
        supportingText: `The first message in this export arrived in ${new Date(stats.firstTimestamp).getFullYear()}.`,
        privacyLevel: "safe",
        renderVariant: "metric",
      };
    case "scale":
      return {
        id: "scale",
        type,
        title: "Somehow, you sent all of these.",
        metric: number(stats.totalMessages),
        subtitle: "messages",
        supportingText: `${number(stats.totalWords)} meaningful words across ${number(stats.activeDays)} active days.`,
        privacyLevel: "safe",
        renderVariant: "metric",
      };
    case "balance": {
      const first = stats.participants[0];
      const second = stats.participants[1];
      if (!first || !second) return null;
      return {
        id: "balance",
        type,
        title: "Who carried the chat?",
        metric: `${first.percentage}% / ${second.percentage}%`,
        supportingText: `${first.name} and ${second.name} made this a ${Math.abs(first.percentage - second.percentage) <= 10 ? "surprisingly even" : "beautifully uneven"} conversation.`,
        privacyLevel: "sensitive",
        renderVariant: "split",
      };
    }
    case "streak":
      return {
        id: "streak",
        type,
        title: "There was a stretch when nobody stopped talking.",
        metric: stats.longestStreak,
        subtitle: "days in a row",
        supportingText: stats.longestSilenceDays > 0 ? `The longest quiet spell between active days was ${stats.longestSilenceDays} days.` : "The chat barely took a day off.",
        privacyLevel: "safe",
        renderVariant: "metric",
      };
    case "busiest-day":
      return {
        id: "busiest-day",
        type,
        title: "This day got out of hand.",
        metric: number(stats.biggestDay.messages),
        subtitle: `messages on ${date(stats.biggestDay.timestamp)}`,
        privacyLevel: "safe",
        renderVariant: "metric",
      };
    case "late-night":
      return {
        id: "late-night",
        type,
        title: "Apparently sleep was optional.",
        metric: hour(stats.peakHour),
        subtitle: "peak chat hour",
        supportingText: `${number(stats.lateNightMessages)} messages landed between midnight and 5am.`,
        privacyLevel: "safe",
        renderVariant: "metric",
      };
    case "language": {
      const word = stats.topWords[0];
      return {
        id: "language",
        type,
        title: word ? "One word kept finding its way back." : "There was plenty of personality in the chat.",
        metric: word?.word ?? number(stats.laughSignals),
        subtitle: word ? `${number(word.count)} appearances` : "laugh signals",
        supportingText: `${number(stats.laughSignals)} laugh signals and ${number(stats.heartSignals)} heart signals made the trail.`,
        privacyLevel: word ? "sensitive" : "safe",
        renderVariant: "metric",
      };
    }
    case "timeline": {
      const peak = [...stats.byYear].sort((a, b) => b.messages - a.messages)[0];
      return {
        id: "timeline",
        type,
        title: "Every year had its own pace.",
        metric: peak ? `${peak.year}` : new Date(stats.lastTimestamp).getFullYear(),
        subtitle: peak ? `${number(peak.messages)} messages in the busiest year` : "your timeline",
        supportingText: `${stats.byYear.length} calendar ${stats.byYear.length === 1 ? "year" : "years"} appear in this export.`,
        privacyLevel: "safe",
        renderVariant: "timeline",
      };
    }
    case "closing":
      return {
        id: "closing",
        type,
        title: config.ending,
        subtitle: `${number(stats.totalMessages)} messages later.`,
        supportingText: "Made privately with ThreadTales.",
        privacyLevel: "safe",
        renderVariant: "closing",
      };
  }
}

export function composeThreadTale(stats: ChatStats, mode: StoryMode = "friends") {
  const config = getStoryModeConfig(mode);
  return config.chapterPriority
    .map((type) => makeChapter(type, stats, mode))
    .filter((chapter): chapter is StoryChapter => chapter !== null);
}

export function createStoryShareManifest(
  stats: ChatStats,
  mode: StoryMode,
  options: { includeSensitive?: boolean; attribution?: boolean } = {},
): ThreadTaleShareManifest {
  const { includeSensitive = false, attribution = true } = options;
  const chapters = composeThreadTale(stats, mode).filter((chapter) => includeSensitive || chapter.privacyLevel === "safe");
  return {
    version: 1,
    mode,
    title: getStoryModeConfig(mode).eyebrow,
    cards: chapters.map(({ id, title, subtitle, metric, renderVariant }) => ({ id, title, subtitle, metric, renderVariant })),
    attribution,
  };
}
