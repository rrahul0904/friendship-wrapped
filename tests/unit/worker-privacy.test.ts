import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workerFiles = [
  "../../src/workers/threadtales.worker.ts",
  "../../src/lib/worker-engine.ts",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

describe("worker privacy boundary", () => {
  it("contains no network transport primitive in the worker execution path", () => {
    const source = workerFiles.join("\n");
    for (const forbidden of ["fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket("]) {
      expect(source).not.toContain(forbidden);
    }
  });
});
