export const MAX_CHAT_BYTES = 15 * 1024 * 1024;
export const MIN_CHAT_MESSAGES = 5;

export interface ChatFileMetadata {
  name: string;
  size: number;
}

export function validateChatFileMetadata(file: ChatFileMetadata): string | null {
  if (!file.name.toLowerCase().endsWith(".txt")) {
    return "Please choose the .txt file from a WhatsApp chat export.";
  }
  if (file.size > MAX_CHAT_BYTES) {
    return "That file is over 15 MB. Please export a smaller text-only chat and try again.";
  }
  return null;
}

export function validateRawChatText(text: string): string | null {
  if (!text.trim()) {
    return "That file is empty. Export a text-only WhatsApp chat and try again.";
  }
  return null;
}

export function tooFewMessagesError(count: number) {
  return `I found only ${count} supported message${count === 1 ? "" : "s"}. Export the chat as a .txt file without media and try again.`;
}
