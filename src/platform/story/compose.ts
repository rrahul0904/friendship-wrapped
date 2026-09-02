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

function replyLabel(minutes: number | null) {
  if (minutes === null) return null;
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 24 * 60) return `${(minutes / 60).toFixed(minutes >= 600 ? 0 : 1)} hr`;
  return `${(minutes / (24 * 60)).toFixed(1)} days`;
}

function strongestResponseBucket(stats: ChatStats) {
  const buckets = [
    { label: "under 5 minutes", value: stats.responseGaps.under5Minutes },
    { label: "5–30 minutes", value: stats.responseGaps.under30Minutes },
    { label: "30 minutes–2 hours", value: stats.responseGaps.under2Hours },
    { label: "2–12 hours", value: stats.responseGaps.under12Hours },
    { label: "over 12 hours", value: stats.responseGaps.over12Hours },
  ];
  return buckets.sort((a, b) => b.value - a.value)[0];
}

function strongestVibe(stats: ChatStats) {
  const vibes = [
    { label: "Night owl", value: stats.vibe.nightOwl },
    { label: "Curious", value: stats.vibe.curiosity },
    { label: "Chaotic", value: stats.vibe.chaos },
    { label: "Affectionate", value: stats.vibe.affection },
  ];
  return vibes.sort((a, b) => b.value - a.value)[0];
}

function makeChapter(type: StoryChapter["type"], stats: ChatStats, mode: StoryMode): StoryChapter | null {
  const config = getStoryModeConfig(mode);

  switch (type) {
    case "cover":
      return { id: "cover", type, title: config.eyebrow, subtitle: "A ThreadTale", supportingText: `${number(stats.daysTogether)} days of conversation`, privacyLevel: "safe", renderVariant: "hero" };
    case "beginning":
      return { id: "beginning", type, title: "This story starts here.", metric: date(stats.firstTimestamp), supportingText: `The first message in this export arrived in ${new Date(stats.firstTimestamp).getFullYear()}.`, privacyLevel: "safe", renderVariant: "metric" };
    case "scale":
      return { id: "scale", type, title: "Somehow, you sent all of these.", metric: number(stats.totalMessages), subtitle: "messages", supportingText: `${number(stats.totalWords)} meaningful words across ${number(stats.activeDays)} active days.`, privacyLevel: "safe", renderVariant: "metric" };
    case "balance": {
      const first = stats.participants[0];
      const second = stats.participants[1];
      if (!first || !second) return null;
      return { id: "balance", type, title: "Who carried the chat?", metric: `${first.percentage}% / ${second.percentage}%`, supportingText: `${first.name} and ${second.name} made this a ${Math.abs(first.percentage - second.percentage) <= 10 ? "surprisingly even" : "beautifully uneven"} conversation.`, privacyLevel: "sensitive", renderVariant: "split" };
    }
    case "conversation-starter": {
      const starter = [...stats.participants].sort((a, b) => b.conversationStarts - a.conversationStarts)[0];
      if (!starter || starter.conversationStarts < 1) return null;
      return { id: "conversation-starter", type, title: "Someone kept pressing start.", metric: starter.conversationStarts, subtitle: "conversation starts", supportingText: `${starter.name} started the most new chat sessions in this export.`, privacyLevel: "sensitive", renderVariant: "metric" };
    }
    case "reply-speed": {
      const label = replyLabel(stats.medianReplyMinutes);
      if (!label) return null;
      return { id: "reply-speed", type, title: "The chat usually came back around.", metric: label, subtitle: "median reply time", supportingText: "Measured only between consecutive messages from different senders.", privacyLevel: "safe", renderVariant: "metric" };
    }
    case "response-rhythm": {
      const bucket = strongestResponseBucket(stats);
      if (!bucket || bucket.value < 1) return null;
      return { id: "response-rhythm", type, title: "This was your most common reply rhythm.", metric: number(bucket.value), subtitle: `replies ${bucket.label}`, supportingText: "A descriptive timing pattern, not a relationship score.", privacyLevel: "safe", renderVariant: "metric" };
    }
    case "streak":
      return { id: "streak", type, title: "There was a stretch when nobody stopped talking.", metric: stats.longestStreak, subtitle: "days in a row", supportingText: stats.longestSilenceDays > 0 ? `The longest quiet spell between active days was ${stats.longestSilenceDays} days.` : "The chat barely took a day off.", privacyLevel: "safe", renderVariant: "metric" };
    case "busiest-day":
      return { id: "busiest-day", type, title: "This day got out of hand.", metric: number(stats.biggestDay.messages), subtitle: `messages on ${date(stats.biggestDay.timestamp)}`, privacyLevel: "safe", renderVariant: "metric" };
    case "late-night":
      return { id: "late-night", type, title: "Apparently sleep was optional.", metric: hour(stats.peakHour), subtitle: "peak chat hour", supportingText: `${number(stats.lateNightMessages)} messages landed between midnight and 5am.`, privacyLevel: "safe", renderVariant: "metric" };
    case "language": {
      const word = stats.topWords[0];
      return { id: "language", type, title: word ? "One word kept finding its way back." : "There was plenty of personality in the chat.", metric: word?.word ?? number(stats.laughSignals), subtitle: word ? `${number(word.count)} appearances` : "laugh signals", supportingText: `${number(stats.laughSignals)} laugh signals and ${number(stats.heartSignals)} heart signals made the trail.`, privacyLevel: word ? "sensitive" : "safe", renderVariant: "metric" };
    }
    case "vibe": {
      const vibe = strongestVibe(stats);
      if (!vibe) return null;
      return { id: "vibe", type, title: "The strongest observable signal in this chat", metric: `${vibe.value}/100`, subtitle: vibe.label, supportingText: "A transparent presentation score built from observable message patterns—not psychology or compatibility.", privacyLevel: "safe", renderVariant: "metric" };
    }
    case "timeline": {
      const peak = [...stats.byYear].sort((a, b) => b.messages - a.messages)[0];
      return { id: "timeline", type, title: "Every year had its own pace.", metric: peak ? `${peak.year}` : new Date(stats.lastTimestamp).getFullYear(), subtitle: peak ? `${number(peak.messages)} messages in the busiest year` : "your timeline", supportingText: `${stats.byYear.length} calendar ${stats.byYear.length === 1 ? "year" : "years"} appear in this export.`, privacyLevel: "safe", renderVariant: "timeline" };
    }
    case "closing":
      return { id: "closing", type, title: config.ending, subtitle: `${number(stats.totalMessages)} messages later.`, supportingText: "Made privately with ThreadTales.", privacyLevel: "safe", renderVariant: "closing" };
  }
}

export function composeThreadTale(stats: ChatStats, mode: StoryMode = "friends") {
  const config = getStoryModeConfig(mode);
  return config.chapterPriority.map((type) => makeChapter(type, stats, mode)).filter((chapter): chapter is StoryChapter => chapter !== null);
}

export function createStoryShareManifest(stats: ChatStats, mode: StoryMode, options: { includeSensitive?: boolean; attribution?: boolean } = {}): ThreadTaleShareManifest {
  const { includeSensitive = false, attribution = true } = options;
  const chapters = composeThreadTale(stats, mode).filter((chapter) => includeSensitive || chapter.privacyLevel === "safe");
  return { version: 1, mode, title: getStoryModeConfig(mode).eyebrow, cards: chapters.map(({ id, title, subtitle, metric, renderVariant }) => ({ id, title, subtitle, metric, renderVariant })), attribution };
}
