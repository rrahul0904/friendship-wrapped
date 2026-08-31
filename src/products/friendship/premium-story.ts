import type { ChatStats, StoryMode } from "@/lib/types";

export interface PremiumChapter {
  id: string;
  ordinal: number;
  title: string;
  kicker: string;
  body: string;
  metric?: string;
  lockedByDefault: boolean;
}

export interface PremiumStory {
  version: 1;
  mode: StoryMode;
  title: string;
  subtitle: string;
  chapters: PremiumChapter[];
}

const MODE_LABELS: Record<StoryMode, { title: string; people: string; relationship: string }> = {
  friends: { title: "Your friendship in 12 chapters", people: "friends", relationship: "friendship" },
  couple: { title: "Your relationship in 12 chapters", people: "two of you", relationship: "relationship" },
  siblings: { title: "Your sibling lore in 12 chapters", people: "siblings", relationship: "sibling story" },
  family: { title: "Your family chat in 12 chapters", people: "family", relationship: "family story" },
  group: { title: "Your group-chat lore in 12 chapters", people: "group", relationship: "group chat" },
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function formatReplyTime(minutes: number | null) {
  if (minutes == null) return "not enough reply switches to estimate";
  if (minutes < 1) return "under a minute";
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  if (minutes < 1_440) return `${(minutes / 60).toFixed(minutes < 120 ? 1 : 0)} hours`;
  return `${(minutes / 1_440).toFixed(1)} days`;
}

function peakYear(stats: ChatStats) {
  return stats.byYear.reduce((best, current) => current.messages > best.messages ? current : best, stats.byYear[0]);
}

function chapter(
  ordinal: number,
  id: string,
  title: string,
  kicker: string,
  body: string,
  metric?: string,
): PremiumChapter {
  return { id, ordinal, title, kicker, body, metric, lockedByDefault: ordinal > 3 };
}

export function generatePremiumStory(stats: ChatStats, mode: StoryMode): PremiumStory {
  const labels = MODE_LABELS[mode];
  const people = stats.participants;
  const lead = people[0];
  const second = people[1];
  const busiestYear = peakYear(stats);
  const starter = [...people].sort((a, b) => b.conversationStarts - a.conversationStarts)[0];
  const fastest = [...people]
    .filter((person) => person.medianReplyMinutes != null)
    .sort((a, b) => (a.medianReplyMinutes ?? Number.POSITIVE_INFINITY) - (b.medianReplyMinutes ?? Number.POSITIVE_INFINITY))[0];
  const questionLeader = [...people].sort((a, b) => b.questions - a.questions)[0];
  const laughLeader = [...people].sort((a, b) => b.laughSignals - a.laughSignals)[0];
  const heartLeader = [...people].sort((a, b) => b.heartSignals - a.heartSignals)[0];
  const messageBalance = second ? Math.abs(lead.percentage - second.percentage) : null;
  const balanceText = messageBalance == null
    ? "This export behaves more like a one-person archive than a two-way conversation."
    : messageBalance <= 10
      ? "The message split is remarkably balanced. Neither side appears to have carried the entire history."
      : `${lead.name} accounts for the largest share of messages at ${lead.percentage}%, so the conversation has a clear volume leader.`;

  const chapters: PremiumChapter[] = [
    chapter(
      1,
      "beginning",
      "Where the record begins",
      "Chapter one",
      `This export starts on ${formatDate(stats.firstTimestamp)}. From that point forward, it contains ${formatNumber(stats.totalMessages)} messages across ${formatNumber(stats.activeDays)} active days. It is the beginning of the record we can actually see—not a claim about when the ${labels.relationship} itself began.`,
      formatDate(stats.firstTimestamp),
    ),
    chapter(
      2,
      "kept-alive",
      "Who kept the thread alive",
      "Chapter two",
      `${balanceText} ${starter ? `${starter.name} also starts the most new conversation sessions after long gaps, with ${formatNumber(starter.conversationStarts)} restarts.` : "There is not enough data to identify a conversation starter."}`,
      lead ? `${lead.name}: ${lead.percentage}%` : undefined,
    ),
    chapter(
      3,
      "busiest-era",
      "The busiest era",
      "Chapter three",
      `${busiestYear.year} is the busiest year visible in this export, with ${formatNumber(busiestYear.messages)} messages. The full timeline spans ${stats.byYear.length} calendar ${stats.byYear.length === 1 ? "year" : "years"}, so this is the strongest message-volume peak we can identify from the data.`,
      `${busiestYear.year} · ${formatNumber(busiestYear.messages)} messages`,
    ),
    chapter(
      4,
      "big-day",
      "The day the chat exploded",
      "Chapter four",
      `The single busiest date in the export is ${formatDate(stats.biggestDay.timestamp)}, when ${formatNumber(stats.biggestDay.messages)} messages were exchanged. The numbers tell us it was unusually active; they do not tell us why without reading the messages themselves.`,
      `${formatNumber(stats.biggestDay.messages)} messages`,
    ),
    chapter(
      5,
      "reply-rhythm",
      "Your reply rhythm",
      "Chapter five",
      `When the sender changes, the median reply arrives in ${formatReplyTime(stats.medianReplyMinutes)}. ${fastest ? `${fastest.name} has the fastest participant-level median in the available data at ${formatReplyTime(fastest.medianReplyMinutes)}.` : "There are not enough sender changes to rank individual reply speeds reliably."}`,
      stats.medianReplyMinutes == null ? undefined : formatReplyTime(stats.medianReplyMinutes),
    ),
    chapter(
      6,
      "after-dark",
      "After-dark behavior",
      "Chapter six",
      `${formatNumber(stats.lateNightMessages)} messages were sent between midnight and 5am, and the busiest clock hour is ${stats.peakHour % 12 || 12}:00${stats.peakHour >= 12 ? "pm" : "am"}. That is the clearest time-of-day fingerprint in this chat history.`,
      `${formatNumber(stats.lateNightMessages)} late-night messages`,
    ),
    chapter(
      7,
      "questions",
      "The question department",
      "Chapter seven",
      `${formatNumber(stats.questionsAsked)} question marks appear across the export. ${questionLeader ? `${questionLeader.name} contributes the most questions in the participant breakdown with ${formatNumber(questionLeader.questions)}.` : "No participant-level question leader is available."} Whether those were serious, practical, or ridiculous is intentionally left to the people who were there.`,
      `${formatNumber(stats.questionsAsked)} questions`,
    ),
    chapter(
      8,
      "laughter",
      "The laugh track",
      "Chapter eight",
      `The analyzer detects ${formatNumber(stats.laughSignals)} laugh signals such as “haha,” “lol,” 😂, or 🤣. ${laughLeader && laughLeader.laughSignals > 0 ? `${laughLeader.name} contributes the most detected laugh signals (${formatNumber(laughLeader.laughSignals)}).` : "No single participant stands out on this signal."}`,
      `${formatNumber(stats.laughSignals)} laugh signals`,
    ),
    chapter(
      9,
      "affection",
      "The tiny affection trail",
      "Chapter nine",
      `There are ${formatNumber(stats.heartSignals)} detected heart-style emoji signals in the export. ${heartLeader && heartLeader.heartSignals > 0 ? `${heartLeader.name} contributes the most detected heart signals (${formatNumber(heartLeader.heartSignals)}).` : "The signal is too small to name a participant leader."} This is only an emoji count, not a measurement of how anyone actually feels.`,
      `${formatNumber(stats.heartSignals)} heart signals`,
    ),
    chapter(
      10,
      "silence",
      "The longest quiet spell",
      "Chapter ten",
      `The longest gap between active chat days is ${formatNumber(stats.longestSilenceDays)} ${stats.longestSilenceDays === 1 ? "day" : "days"}. The important thing the data can say is simple: activity appears again later in the export, so the thread resumes after that quiet stretch.`,
      `${formatNumber(stats.longestSilenceDays)} quiet days`,
    ),
    chapter(
      11,
      "cast",
      "The cast of characters",
      "Chapter eleven",
      people.slice(0, 4).map((person) => `${person.name} writes about ${person.avgWords} words per message, contributes ${person.percentage}% of messages, and starts ${formatNumber(person.conversationStarts)} conversation sessions.`).join(" ") || `There is not enough participant data to build a ${labels.people} cast profile.`,
      `${people.length} ${people.length === 1 ? "participant" : "participants"}`,
    ),
    chapter(
      12,
      "so-far",
      "The story so far",
      "Chapter twelve",
      `Across ${formatNumber(stats.daysTogether)} calendar days covered by the export, this ${labels.relationship} produced ${formatNumber(stats.totalMessages)} messages, a ${formatNumber(stats.longestStreak)}-day longest streak, and activity on ${formatNumber(stats.activeDays)} different days. That is not the whole relationship—it is the shape of the digital trail you chose to analyze.`,
      `${formatNumber(stats.totalMessages)} messages so far`,
    ),
  ];

  return {
    version: 1,
    mode,
    title: labels.title,
    subtitle: `A deterministic story built from the patterns in ${formatNumber(stats.totalMessages)} messages—without uploading the raw chat.`,
    chapters,
  };
}
