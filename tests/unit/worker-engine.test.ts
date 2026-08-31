import { describe, expect, it } from "vitest";
import { runAnalysisRequest } from "../../src/lib/worker-engine";
import { isWorkerResponse, type WorkerResponse } from "../../src/lib/worker-protocol";

function collect(text: string) {
  const responses: WorkerResponse[] = [];
  runAnalysisRequest({
    type: "ANALYZE_CHAT",
    requestId: "req-1",
    content: { kind: "text", text },
    options: { dateOrder: "mdy" },
  }, (response) => responses.push(response));
  return responses;
}

const valid = [
  "2/13/2026, 9:10 AM - Alice: one",
  "2/13/2026, 9:11 AM - Bob: two",
  "2/13/2026, 9:12 AM - Alice: three",
  "2/13/2026, 9:13 AM - Bob: four",
  "2/13/2026, 9:14 AM - Alice: five",
].join("\n");

describe("worker engine", () => {
  it("emits real stages and a V2 success result", () => {
    const responses = collect(valid);
    expect(responses.filter((response) => response.type === "PROGRESS").map((response) => response.type === "PROGRESS" ? response.stage : null)).toEqual([
      "validating",
      "parsing",
      "analyzing",
      "finalizing",
    ]);
    const success = responses.at(-1);
    expect(success?.type).toBe("SUCCESS");
    if (success?.type === "SUCCESS") expect(success.result.schemaVersion).toBe(2);
  });

  it("returns a serialized recoverable error for empty input", () => {
    const responses = collect("   \n");
    const error = responses.at(-1);
    expect(error?.type).toBe("ERROR");
    if (error?.type === "ERROR") expect(error.error.code).toBe("INVALID_INPUT");
  });

  it("returns a too-few-messages error without throwing", () => {
    const responses = collect("2/13/2026, 9:10 AM - Alice: one");
    const error = responses.at(-1);
    expect(error?.type).toBe("ERROR");
    if (error?.type === "ERROR") expect(error.error.code).toBe("TOO_FEW_MESSAGES");
  });

  it("validates worker response envelopes", () => {
    expect(isWorkerResponse({ type: "CANCELLED", requestId: "abc" })).toBe(true);
    expect(isWorkerResponse({ type: "UNKNOWN", requestId: "abc" })).toBe(false);
    expect(isWorkerResponse({ type: "SUCCESS" })).toBe(false);
  });
});
