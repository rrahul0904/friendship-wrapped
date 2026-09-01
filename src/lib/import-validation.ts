export const MAX_CHAT_BYTES = 15 * 1024 * 1024;
export const MIN_CHAT_MESSAGES = 5;

export interface ChatFileMetadata { name: string; size: number; }

export function validateChatFileMetadata(file: ChatFileMetadata): string | null {
  const lower = file.name.toLowerCase();
  if (!lower.endsWith(".txt") && !lower.endsWith(".json")) return "Please choose a .txt WhatsApp export or a .json Telegram chat export.";
  if (file.size > MAX_CHAT_BYTES) return "That file is over 15 MB. Please export a smaller text-only chat and try again.";
  return null;
}

export function validateRawChatText(text: string): string | null {
  if (!text.trim()) return "That file is empty. Export a supported chat and try again.";
  return null;
}

export function tooFewMessagesError(count: number) { return `I found only ${count} supported message${count === 1 ? "" : "s"}. Export a supported single chat without media and try again.`; }
