import { describe, expect, it } from "vitest";
import { analyzeThreadTale } from "../../src/lib/analyze";
import { parseChatDetailed } from "../../src/lib/parser";
import { makeSyntheticChat } from "../helpers/synthetic-chat";

describe("large synthetic histories", () => {
  it("parses and analyzes 10,000 deterministic messages", () => {
    const raw = makeSyntheticChat({ messages: 10_000, participants: 4, seed: 7 });
    const parsed = parseChatDetailed(raw, "auto");
    const result = analyzeThreadTale(parsed);
    expect(parsed.messages).toHaveLength(10_000);
    expect(result.totals.messages).toBe(10_000);
    expect(result.totals.participants).toBe(4);
    expect(result.schemaVersion).toBe(2);
  });
});
