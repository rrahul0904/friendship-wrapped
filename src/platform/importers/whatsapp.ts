import { analyzeChat } from "@/lib/analyze";
import { MIN_CHAT_MESSAGES, tooFewMessagesError } from "@/lib/import-validation";
import { parseChat } from "@/lib/parser";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import type { ChatImporter } from "./types";

export const whatsappTextImporter: ChatImporter = {
  id: "whatsapp-text",
  label: "WhatsApp text export",
  canHandle(input) {
    return input.name.toLowerCase().endsWith(".txt") || input.type === "text/plain";
  },
  async parse(input, options) {
    const messages = parseChat(input.text, options.dateOrder);
    if (messages.length < MIN_CHAT_MESSAGES) throw new Error(tooFewMessagesError(messages.length));
    const stats = analyzeChat(messages);
    return {
      messages,
      stats,
      result: toThreadTaleResultV2(stats, "whatsapp"),
      warnings: options.dateOrder === "auto" ? ["Ambiguous numeric dates are interpreted US-first. Change the date selector if the timeline looks wrong."] : [],
    };
  },
};
