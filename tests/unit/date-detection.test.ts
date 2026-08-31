import { describe, expect, it } from "vitest";
import { detectDateOrder, parseChatDetailed } from "../../src/lib/parser";

describe("date order detection", () => {
  it("detects unambiguous DMY evidence", () => {
    const raw = [
      "13/02/2026, 09:10 - Alice: one",
      "14/02/2026, 09:11 - Bob: two",
    ].join("\n");
    expect(detectDateOrder(raw)).toEqual({ detected: "dmy", confidence: "high", evidenceCount: 2 });
    expect(parseChatDetailed(raw, "auto").dateOrder).toBe("dmy");
  });

  it("detects unambiguous MDY evidence", () => {
    const raw = [
      "2/13/2026, 9:10 AM - Alice: one",
      "2/14/2026, 9:11 AM - Bob: two",
    ].join("\n");
    expect(detectDateOrder(raw)).toEqual({ detected: "mdy", confidence: "high", evidenceCount: 2 });
    expect(parseChatDetailed(raw, "auto").dateOrder).toBe("mdy");
  });

  it("reports ambiguous dates and preserves the Phase 0 US-first fallback", () => {
    const raw = "4/5/2026, 9:10 AM - Alice: ambiguous";
    expect(detectDateOrder(raw)).toEqual({ detected: null, confidence: "ambiguous", evidenceCount: 0 });
    expect(parseChatDetailed(raw, "auto").dateOrder).toBe("mdy");
  });

  it("honors an explicit override even when detection sees the opposite order", () => {
    const raw = "13/02/2026, 09:10 - Alice: one";
    const parsed = parseChatDetailed(raw, "mdy");
    expect(parsed.dateOrder).toBe("mdy");
    expect(parsed.messages).toHaveLength(0);
  });
});
