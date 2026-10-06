import type { MemoryIntentKind } from "./memory-space";
import type { MemoryCandidateKind, MemoryGraph, MemoryNode } from "./memory-graph";

export type StoryBeatKind =
  | "OPENING"
  | "MEMORY"
  | "REFLECTION"
  | "DEDICATION"
  | "QUESTION"
  | "CLOSING";

export type StoryBeatSource = "MEMORY_NODE" | "INTENT_COPY" | "USER_REQUIRED";

export interface StoryBeat {
  id: string;
  kind: StoryBeatKind;
  title: string;
  body?: string;
  memoryNodeId?: string;
  source: StoryBeatSource;
}

export interface MemoryStoryPlan {
  schemaVersion: 1;
  memorySpaceId: string;
  intent: MemoryIntentKind;
  generatedAt: string;
  title: string;
  subtitle: string;
  beats: StoryBeat[];
  requiresUserDedication: boolean;
}

interface IntentGrammar {
  title: string;
  subtitle: string;
  openingTitle: string;
  openingBody: string;
  preferredKinds: MemoryCandidateKind[];
  maxMemories: number;
  reflection?: { title: string; body: string };
  dedication?: { title: string; body: string };
  question?: { title: string; body: string };
  closing?: { title: string; body: string };
}

const GRAMMARS: Record<MemoryIntentKind, IntentGrammar> = {
  MEMORY_LANE: {
    title: "Memory lane",
    subtitle: "A walk through the moments that made this story yours.",
    openingTitle: "Let’s go back for a minute.",
    openingBody: "These are memories you chose to keep, arranged into one small journey.",
    preferredKinds: ["BEGINNING", "BUSIEST_YEAR", "SHARED_LANGUAGE", "BIG_DAY", "LONGEST_STREAK", "LATE_NIGHT", "LAUGH_SIGNAL", "HEART_SIGNAL", "LONGEST_SILENCE"],
    maxMemories: 8,
    closing: { title: "And the story keeps going.", body: "This MemorySpace can keep growing with new moments over time." },
  },
  VALENTINE_GIFT: {
    title: "A Valentine from our memories",
    subtitle: "Real moments first. Your words at the end.",
    openingTitle: "Before the Valentine, there was the story.",
    openingBody: "A few memories you chose because they belong to the two of you.",
    preferredKinds: ["BEGINNING", "SHARED_LANGUAGE", "HEART_SIGNAL", "LATE_NIGHT", "LONGEST_STREAK", "BIG_DAY", "LAUGH_SIGNAL", "BUSIEST_YEAR"],
    maxMemories: 6,
    dedication: { title: "Now say the part only you can say.", body: "Write your Valentine message in your own words." },
    closing: { title: "Made from your history.", body: "Nothing here needs a made-up relationship claim to be meaningful." },
  },
  PROM_INVITATION: {
    title: "One question, with a little history first",
    subtitle: "Short, playful, and personal.",
    openingTitle: "This could have been a text.",
    openingBody: "But a few shared moments make the question more fun.",
    preferredKinds: ["BEGINNING", "LAUGH_SIGNAL", "SHARED_LANGUAGE", "BIG_DAY", "LATE_NIGHT"],
    maxMemories: 3,
    question: { title: "So…", body: "Will you go to prom with me?" },
  },
  DATE_INVITATION: {
    title: "Be my date",
    subtitle: "A personal invitation built from moments you already share.",
    openingTitle: "I had a better idea than sending one plain message.",
    openingBody: "Here are a few reasons this invitation feels like ours.",
    preferredKinds: ["BEGINNING", "LAUGH_SIGNAL", "SHARED_LANGUAGE", "LATE_NIGHT", "BIG_DAY"],
    maxMemories: 3,
    question: { title: "One more memory?", body: "Will you be my date?" },
  },
  APOLOGY: {
    title: "Something I need to say",
    subtitle: "Shared history can provide context. The apology must still come from you.",
    openingTitle: "Some things deserve more care than a quick message.",
    openingBody: "These memories are here to remember what matters—not to excuse what happened or speak for anyone else.",
    preferredKinds: ["BEGINNING", "SHARED_LANGUAGE", "LONGEST_STREAK", "BIG_DAY", "BUSIEST_YEAR", "LAUGH_SIGNAL", "HEART_SIGNAL"],
    maxMemories: 3,
    reflection: { title: "The memories are context, not the apology.", body: "ThreadTales will not invent feelings, blame, forgiveness, or intent from message patterns." },
    dedication: { title: "Write the apology in your own words.", body: "Say what happened, take responsibility where appropriate, and say what you want them to know." },
  },
  I_LOVE_YOU: {
    title: "I love you",
    subtitle: "A few pieces of history behind three important words.",
    openingTitle: "Three words can carry a lot of history.",
    openingBody: "These are some of the moments you chose to put behind them.",
    preferredKinds: ["BEGINNING", "SHARED_LANGUAGE", "HEART_SIGNAL", "LONGEST_STREAK", "LATE_NIGHT", "BIG_DAY", "LAUGH_SIGNAL"],
    maxMemories: 5,
    dedication: { title: "Finish it in your voice.", body: "Write what ‘I love you’ means to you here." },
  },
  ANNIVERSARY: {
    title: "Another chapter together",
    subtitle: "From the beginning to the history you are still making.",
    openingTitle: "Start at the beginning.",
    openingBody: "An anniversary is a good excuse to look at how much life fits between then and now.",
    preferredKinds: ["BEGINNING", "BUSIEST_YEAR", "LONGEST_STREAK", "BIG_DAY", "SHARED_LANGUAGE", "LATE_NIGHT", "LAUGH_SIGNAL", "HEART_SIGNAL", "LONGEST_SILENCE"],
    maxMemories: 7,
    reflection: { title: "Not every chapter looks the same.", body: "The graph keeps both the busy moments and the quiet stretches without pretending to know what they meant." },
    dedication: { title: "What do you want them to hear today?", body: "Add your anniversary message in your own words." },
    closing: { title: "Leave room for the next chapter.", body: "The MemorySpace stays open for whatever comes next." },
  },
  PROUD_OF_YOU: {
    title: "Proud of you",
    subtitle: "A celebration of growth, effort, and the memories that led here.",
    openingTitle: "Look how far this story has come.",
    openingBody: "Start with real moments, then say why you are proud in your own voice.",
    preferredKinds: ["BEGINNING", "BUSIEST_YEAR", "LONGEST_STREAK", "BIG_DAY", "SHARED_LANGUAGE", "LAUGH_SIGNAL", "LATE_NIGHT"],
    maxMemories: 5,
    dedication: { title: "Tell them why you’re proud.", body: "Add the achievement, effort, growth, or quality you personally want to celebrate." },
  },
  GROUP_MEMORY: {
    title: "The group memory",
    subtitle: "The chaos, language, years, and moments that became shared history.",
    openingTitle: "Every group has its own mythology.",
    openingBody: "Here are a few parts of this one that you chose to keep.",
    preferredKinds: ["BEGINNING", "BIG_DAY", "LAUGH_SIGNAL", "SHARED_LANGUAGE", "BUSIEST_YEAR", "LATE_NIGHT", "LONGEST_STREAK", "LONGEST_SILENCE"],
    maxMemories: 7,
    closing: { title: "Same group. More chapters later.", body: "Trips, photos, videos, places, and contributions can keep expanding this MemorySpace." },
  },
};

function memoryBeat(node: MemoryNode, index: number): StoryBeat {
  return {
    id: `memory-${index + 1}-${node.id}`,
    kind: "MEMORY",
    title: node.title,
    body: node.detail,
    memoryNodeId: node.id,
    source: "MEMORY_NODE",
  };
}

function selectNodes(nodes: MemoryNode[], grammar: IntentGrammar): MemoryNode[] {
  const unused = [...nodes];
  const selected: MemoryNode[] = [];

  for (const kind of grammar.preferredKinds) {
    if (selected.length >= grammar.maxMemories) break;
    const index = unused.findIndex((node) => node.kind === kind);
    if (index === -1) continue;
    selected.push(unused[index]);
    unused.splice(index, 1);
  }

  for (const node of unused) {
    if (selected.length >= grammar.maxMemories) break;
    selected.push(node);
  }

  return selected;
}

export function composeMemoryStory(
  graph: MemoryGraph,
  intent: MemoryIntentKind,
  now = new Date(),
): MemoryStoryPlan {
  const grammar = GRAMMARS[intent];
  const nodes = selectNodes(graph.nodes, grammar);
  const beats: StoryBeat[] = [
    {
      id: "opening",
      kind: "OPENING",
      title: grammar.openingTitle,
      body: grammar.openingBody,
      source: "INTENT_COPY",
    },
    ...nodes.map(memoryBeat),
  ];

  if (grammar.reflection) {
    beats.push({
      id: "reflection",
      kind: "REFLECTION",
      title: grammar.reflection.title,
      body: grammar.reflection.body,
      source: "INTENT_COPY",
    });
  }

  if (grammar.dedication) {
    beats.push({
      id: "dedication",
      kind: "DEDICATION",
      title: grammar.dedication.title,
      body: grammar.dedication.body,
      source: "USER_REQUIRED",
    });
  }

  if (grammar.question) {
    beats.push({
      id: "question",
      kind: "QUESTION",
      title: grammar.question.title,
      body: grammar.question.body,
      source: "INTENT_COPY",
    });
  }

  if (grammar.closing) {
    beats.push({
      id: "closing",
      kind: "CLOSING",
      title: grammar.closing.title,
      body: grammar.closing.body,
      source: "INTENT_COPY",
    });
  }

  return {
    schemaVersion: 1,
    memorySpaceId: graph.memorySpaceId,
    intent,
    generatedAt: now.toISOString(),
    title: grammar.title,
    subtitle: grammar.subtitle,
    beats,
    requiresUserDedication: Boolean(grammar.dedication),
  };
}

export function storyPlanStorageKey(memorySpaceId: string, intent: MemoryIntentKind) {
  return `threadtales:memory-story-plan:v1:${memorySpaceId}:${intent}`;
}
