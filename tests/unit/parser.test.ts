import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseChat } from "../../src/lib/parser";

function fixture(name: string) {
  return readFileSync(new URL(`../fixtures/whatsapp/${name}`, import.meta.url), "utf8");
}

function parts(timestamp: number) {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

describe("parseChat", () => {
  it("parses Android MM/DD 12-hour exports, ignores system lines, and preserves multiline bodies", () => {
    const messages = parseChat(fixture("android-mdy-12h.txt"), "mdy");
    expect(messages).toHaveLength(5);
    expect(messages[0].sender).toBe("Maya Rose");
    expect(messages[1].text).toBe("Morning: coffee?");
    expect(messages[2].text).toBe("yes\nthis continues on a second line");
    expect(parts(messages[0].timestamp)).toEqual({ year: 2026, month: 2, day: 3, hour: 9, minute: 10 });
    expect(parts(messages[3].timestamp).hour).toBe(23);
    expect(parts(messages[4].timestamp).hour).toBe(0);
  });

  it("parses Android DD/MM and 24-hour timestamps", () => {
    const messages = parseChat(fixture("android-dmy-24h.txt"), "dmy");
    expect(messages).toHaveLength(5);
    expect(parts(messages[0].timestamp)).toEqual({ year: 2026, month: 2, day: 13, hour: 9, minute: 10 });
    expect(parts(messages[2].timestamp).hour).toBe(18);
  });

  it("auto-detects unambiguous DD/MM dates", () => {
    const messages = parseChat(fixture("android-dmy-24h.txt"), "auto");
    expect(parts(messages[0].timestamp).day).toBe(13);
    expect(parts(messages[0].timestamp).month).toBe(2);
  });

  it("normalizes two-digit years", () => {
    const messages = parseChat(fixture("android-two-digit-year.txt"), "mdy");
    expect(messages).toHaveLength(5);
    expect(parts(messages[0].timestamp).year).toBe(2026);
  });

  it("parses iOS bracketed timestamps and multiline bodies", () => {
    const messages = parseChat(fixture("ios-dmy.txt"), "dmy");
    expect(messages).toHaveLength(5);
    expect(messages[1].text).toBe("Coffee: now?");
    expect(messages[2].text).toBe("Dinner later\ncontinued thought");
  });

  it("accepts harmless Unicode direction and spacing characters", () => {
    const raw = "\u200e2/3/2026,\u202f9:10\u202fAM - Maya Rose: hello\n2/3/2026, 9:11 AM - Jordan Lee: hi";
    const messages = parseChat(raw, "mdy");
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe("hello");
  });

  it("rejects impossible calendar dates instead of allowing Date normalization", () => {
    const raw = [
      "2/31/2026, 9:10 AM - Maya Rose: impossible",
      "2/28/2026, 9:11 AM - Jordan Lee: valid",
    ].join("\n");
    const messages = parseChat(raw, "mdy");
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toBe("valid");
  });

  it("rejects invalid 12-hour and 24-hour times", () => {
    const raw = [
      "2/3/2026, 13:10 PM - Maya Rose: invalid ampm",
      "2/3/2026, 24:10 - Maya Rose: invalid 24h",
      "2/3/2026, 23:10 - Jordan Lee: valid",
    ].join("\n");
    const messages = parseChat(raw, "mdy");
    expect(messages).toHaveLength(1);
    expect(parts(messages[0].timestamp).hour).toBe(23);
  });

  it("does not append malformed timestamped lines to the prior message", () => {
    const raw = [
      "2/3/2026, 9:10 AM - Maya Rose: first",
      "2/99/2026, 9:11 AM - malformed timestamp line",
      "still part of first",
      "2/3/2026, 9:12 AM - Jordan Lee: second",
    ].join("\n");
    const messages = parseChat(raw, "mdy");
    expect(messages).toHaveLength(2);
    expect(messages[0].text).toBe("first\nstill part of first");
  });

  it("returns an empty list for blank or unsupported input", () => {
    expect(parseChat("", "auto")).toEqual([]);
    expect(parseChat("not a WhatsApp export", "auto")).toEqual([]);
  });
});
