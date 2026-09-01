import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { analyzeChat } from "../../src/lib/analyze";
import { parseChat } from "../../src/lib/parser";
import { makeSyntheticChat } from "../helpers/synthetic-chat";

describe("large-history performance baseline", () => {
  for (const messages of [10_000, 50_000, 100_000]) {
    it(`${messages.toLocaleString()} messages`, () => {
      const raw = makeSyntheticChat({ messages, participants: 4, seed: 42 });
      const parseStart = performance.now();
      const parsed = parseChat(raw, "auto");
      const parseMs = performance.now() - parseStart;
      const analyzeStart = performance.now();
      const result = analyzeChat(parsed);
      const analyzeMs = performance.now() - analyzeStart;
      process.stdout.write(`PERF messages=${messages} parseMs=${parseMs.toFixed(1)} analyzeMs=${analyzeMs.toFixed(1)} totalMs=${(parseMs + analyzeMs).toFixed(1)}\n`);
      expect(result.totalMessages).toBe(messages);
      expect(parseMs + analyzeMs).toBeLessThan(30_000);
    }, 35_000);
  }
});
