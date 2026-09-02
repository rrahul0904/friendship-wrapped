import { analyzeChat } from "@/lib/analyze";
import { MIN_CHAT_MESSAGES, tooFewMessagesError } from "@/lib/import-validation";
import type { ChatMessage } from "@/lib/types";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import type { ChatImporter } from "./types";

type TelegramTextPart = string | { text?: string };
type TelegramMessage = { type?: string; date?: string; from?: string; actor?: string; text?: string | TelegramTextPart[]; media_type?: string; photo?: string; file?: string };
type TelegramChat = { name?: string; messages?: TelegramMessage[] };
type TelegramExport = { messages?: TelegramMessage[]; chats?: { list?: TelegramChat[] } };

function textOf(value: TelegramMessage["text"]) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((part) => typeof part === "string" ? part : part.text ?? "").join("");
}

function selectMessages(root: TelegramExport) {
  if (Array.isArray(root.messages)) return root.messages;
  const chats = root.chats?.list?.filter((chat) => Array.isArray(chat.messages)) ?? [];
  if (chats.length === 1) return chats[0].messages ?? [];
  if (chats.length > 1) throw new Error("This Telegram export contains multiple chats. Export or select one chat as JSON so ThreadTales does not combine unrelated conversations.");
  throw new Error("I couldn't find a Telegram message list in this JSON export.");
}

export const telegramJsonImporter: ChatImporter = {
  id: "telegram-json",
  label: "Telegram JSON chat export",
  canHandle(input) { return input.name.toLowerCase().endsWith(".json") || input.type === "application/json"; },
  async parse(input) {
    let root: TelegramExport;
    try { root = JSON.parse(input.text) as TelegramExport; }
    catch { throw new Error("That .json file is not valid Telegram JSON."); }
    const messages: ChatMessage[] = [];
    for (const message of selectMessages(root)) {
      if (message.type && message.type !== "message") continue;
      const timestamp = Date.parse(message.date ?? "");
      if (!Number.isFinite(timestamp)) continue;
      const sender = (message.from ?? message.actor ?? "Unknown").trim();
      const body = textOf(message.text).trim() || (message.media_type || message.photo || message.file ? "<Media omitted>" : "");
      if (!sender || !body) continue;
      messages.push({ sender, timestamp, text: body });
    }
    messages.sort((a, b) => a.timestamp - b.timestamp);
    if (messages.length < MIN_CHAT_MESSAGES) throw new Error(tooFewMessagesError(messages.length));
    const stats = analyzeChat(messages);
    return { messages, stats, result: toThreadTaleResultV2(stats, "telegram"), warnings: ["Telegram JSON was parsed locally. Message text remains browser-only in the free flow."] };
  },
};
