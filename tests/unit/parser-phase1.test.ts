import { describe, expect, it } from "vitest";
import { parseChatDetailed } from "../../src/lib/parser";

function parts(timestamp: number) {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
  };
}

describe("Phase 1 WhatsApp parser hardening", () => {
  it("handles BOM, CRLF, seconds, and a file without a final newline", () => {
    const raw = "\uFEFF2/13/2026, 9:10:05 AM - Alice 😀: first\r\n2/13/2026, 9:11:06 AM - Bob: second";
    const parsed = parseChatDetailed(raw, "auto");
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[0].sender).toBe("Alice 😀");
    expect(parts(parsed.messages[0].timestamp)).toMatchObject({ year: 2026, month: 2, day: 13, hour: 9, minute: 10, second: 5 });
  });

  it("accepts leap day in a leap year and rejects it in a non-leap year", () => {
    const raw = [
      "2/29/2024, 9:10 AM - Alice: leap",
      "2/29/2025, 9:11 AM - Bob: impossible",
      "3/1/2025, 9:12 AM - Bob: valid",
    ].join("\n");
    const parsed = parseChatDetailed(raw, "mdy");
    expect(parsed.messages.map((message) => message.text)).toEqual(["leap", "valid"]);
  });

  it("handles year boundaries and empty message bodies", () => {
    const raw = [
      "12/31/2025, 11:59:59 PM - Alice: end",
      "1/1/2026, 12:00:01 AM - Bob: ",
    ].join("\n");
    const parsed = parseChatDetailed(raw, "mdy");
    expect(parsed.messages).toHaveLength(2);
    expect(parsed.messages[1].text).toBe("");
    expect(new Date(parsed.messages[1].timestamp).getFullYear()).toBe(2026);
  });

  it("preserves a continuation line that resembles text but not a full timestamp", () => {
    const raw = [
      "2/13/2026, 9:10 AM - Alice: first",
      "13:45 was the time we mentioned",
      "2/13/2026, 9:11 AM - Bob: second",
    ].join("\n");
    const parsed = parseChatDetailed(raw, "mdy");
    expect(parsed.messages[0].text).toBe("first\n13:45 was the time we mentioned");
  });

  it("reports mixed format when Android and iOS records coexist", () => {
    const raw = [
      "2/13/2026, 9:10 AM - Alice: android",
      "[2/13/2026, 9:11 AM] Bob: ios",
    ].join("\n");
    expect(parseChatDetailed(raw, "mdy").format).toBe("mixed");
  });
});
