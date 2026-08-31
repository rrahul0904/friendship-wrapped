import { describe, expect, it } from "vitest";
import { analyzeChat } from "../../src/lib/analyze";
import { createSnapshot, decodeSnapshot, encodeSnapshot } from "../../src/lib/share";
import type { ChatMessage } from "../../src/lib/types";

const secret = "ultra private sentence do not publish";
const messages: ChatMessage[] = [
  { sender: "Private Alice", timestamp: new Date(2026, 0, 1, 9, 0).getTime(), text: secret },
  { sender: "Private Bob", timestamp: new Date(2026, 0, 1, 9, 5).getTime(), text: "hello back" },
];

describe("share boundary", () => {
  it("creates a default snapshot with anonymous names and no top words or raw messages", () => {
    const snapshot = createSnapshot(analyzeChat(messages));
    const serialized = JSON.stringify(snapshot);

    expect(snapshot.participants.map((p) => p.name)).toEqual(["Person 1", "Person 2"]);
    expect(snapshot.topWords).toBeUndefined();
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("Private Alice");
    expect(serialized).not.toContain("Private Bob");
  });

  it("round-trips a derived snapshot through base64url encoding", () => {
    const snapshot = createSnapshot(analyzeChat(messages), { mode: "friends" });
    const encoded = encodeSnapshot(snapshot);
    expect(encoded).not.toContain(secret);
    expect(decodeSnapshot(encoded)).toEqual(snapshot);
  });

  it("only includes identifying derived fields when explicitly requested", () => {
    const snapshot = createSnapshot(analyzeChat(messages), { includeNames: true, includeTopWords: true });
    expect(snapshot.participants[0].name).toBe("Private Alice");
    expect(snapshot.topWords?.length).toBeGreaterThan(0);
    expect(JSON.stringify(snapshot)).not.toContain(secret);
  });

  it("rejects malformed share payloads", () => {
    expect(decodeSnapshot("not-valid-base64-json")).toBeNull();
  });
});
