import { describe, expect, it } from "vitest";
import {
  MAX_CHAT_BYTES,
  tooFewMessagesError,
  validateChatFileMetadata,
  validateRawChatText,
} from "../../src/lib/import-validation";

describe("chat import validation", () => {
  it("accepts a normal text export", () => {
    expect(validateChatFileMetadata({ name: "chat.TXT", size: 1000 })).toBeNull();
  });

  it("rejects unsupported extensions", () => {
    expect(validateChatFileMetadata({ name: "chat.zip", size: 1000 })).toContain(".txt");
  });

  it("rejects files over the client-side limit", () => {
    expect(validateChatFileMetadata({ name: "chat.txt", size: MAX_CHAT_BYTES + 1 })).toContain("over 15 MB");
  });

  it("rejects empty text", () => {
    expect(validateRawChatText("  \n\t ")).toContain("empty");
  });

  it("creates an actionable too-few-message error", () => {
    expect(tooFewMessagesError(3)).toContain("only 3 supported messages");
  });
});
