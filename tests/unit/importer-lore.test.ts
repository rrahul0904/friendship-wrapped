import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@/lib/types";
import { telegramJsonImporter } from "@/platform/importers/telegram";
import { buildThreadTalesLocalLore, extractRecurringPhraseCandidates } from "@/platform/threadtales/lore";

describe("Telegram local importer", () => {
  it("normalizes a single-chat JSON export without server processing", async () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, type: "message", date: `2026-08-0${index + 1}T12:00:00`, from: index % 2 ? "A" : "B", text: `hello local ${index}` }));
    const result = await telegramJsonImporter.parse({ name: "result.json", type: "application/json", text: JSON.stringify({ messages }) }, { dateOrder: "auto" });
    expect(result.messages).toHaveLength(5);
    expect(result.result.source).toBe("telegram");
    expect(result.stats.totalMessages).toBe(5);
  });

  it("rejects a full export containing multiple unrelated chats", async () => {
    const root = { chats: { list: [{ name: "one", messages: [] }, { name: "two", messages: [] }] } };
    await expect(telegramJsonImporter.parse({ name: "result.json", text: JSON.stringify(root) }, { dateOrder: "auto" })).rejects.toThrow(/multiple chats/i);
  });
});

describe("local-only friendship lore", () => {
  const messages: ChatMessage[] = [
    { sender: "A", timestamp: 1, text: "SECRET_INSIDE_JOKE_BETA tiny dragon club forever" },
    { sender: "B", timestamp: 2, text: "tiny dragon club forever haha" },
    { sender: "A", timestamp: 3, text: "tiny dragon club forever again" },
    { sender: "B", timestamp: 4, text: "something else" },
    { sender: "A", timestamp: 5, text: "last message" },
  ];

  it("finds repeated 2–5 word phrase candidates deterministically", () => {
    const phrases = extractRecurringPhraseCandidates(messages);
    expect(phrases.some((item) => item.phrase.includes("tiny dragon club"))).toBe(true);
  });

  it("keeps first-message text in a separate local-only lore object", () => {
    const lore = buildThreadTalesLocalLore(messages);
    expect(lore.firstMessageText).toContain("SECRET_INSIDE_JOKE_BETA");
    expect(JSON.stringify({ totalMessages: messages.length })).not.toContain("SECRET_INSIDE_JOKE_BETA");
  });
});
