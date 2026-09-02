import type { ChatMessage } from "@/lib/types";

export interface RecurringPhraseCandidate {
  phrase: string;
  count: number;
}

export interface ThreadTalesLocalLore {
  firstMessageText?: string;
  recurringPhrases: RecurringPhraseCandidate[];
}

const STOP_PHRASE_WORDS = new Set([
  "the", "and", "that", "this", "with", "have", "just", "from", "your", "you", "are", "was", "were", "for", "but", "not", "what", "when", "how", "can", "will", "would", "could", "should", "they", "them", "then", "than", "its", "it's", "im", "i'm", "yeah", "yes", "okay", "ok",
]);

function words(text: string) {
  return text
    .normalize("NFKC")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/<media omitted>|image omitted|video omitted|sticker omitted/gi, " ")
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu)?.slice(0, 80) ?? [];
}

function usefulPhrase(tokens: string[]) {
  if (tokens.length < 2) return false;
  if (tokens.every((token) => STOP_PHRASE_WORDS.has(token))) return false;
  return tokens.some((token) => token.length >= 4 && !STOP_PHRASE_WORDS.has(token));
}

export function extractRecurringPhraseCandidates(messages: ChatMessage[], limit = 8) {
  const counts = new Map<string, number>();
  for (const message of messages) {
    const tokens = words(message.text);
    const seen = new Set<string>();
    for (let size = 2; size <= 5; size += 1) {
      for (let start = 0; start + size <= tokens.length; start += 1) {
        const slice = tokens.slice(start, start + size);
        if (!usefulPhrase(slice)) continue;
        const phrase = slice.join(" ");
        if (phrase.length > 80 || seen.has(phrase)) continue;
        seen.add(phrase);
        counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 3)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count || b.phrase.split(" ").length - a.phrase.split(" ").length || a.phrase.localeCompare(b.phrase))
    .slice(0, Math.max(0, Math.min(12, limit)));
}

export function buildThreadTalesLocalLore(messages: ChatMessage[]): ThreadTalesLocalLore {
  return {
    firstMessageText: messages[0]?.text.trim().slice(0, 240) || undefined,
    recurringPhrases: extractRecurringPhraseCandidates(messages),
  };
}
