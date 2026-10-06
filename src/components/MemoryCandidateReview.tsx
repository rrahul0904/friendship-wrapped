"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats } from "@/lib/types";
import type { ThreadTalesLocalLore } from "@/platform/threadtales/lore";
import {
  applyMemoryDecision,
  buildConversationMemoryCandidates,
  isMemoryGraph,
  memoryGraphStorageKey,
  memoryReviewStorageKey,
  newMemoryGraph,
  type MemoryDecision,
  type MemoryGraph,
  type MemoryReviewState,
} from "@/lib/memory-graph";
import styles from "./MemoryCandidateReview.module.css";

interface MemoryCandidateReviewProps {
  memorySpaceId: string;
  stats: ChatStats;
  lore: ThreadTalesLocalLore | null;
}

function readGraph(memorySpaceId: string): MemoryGraph {
  try {
    const raw = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
    if (!raw) return newMemoryGraph(memorySpaceId);
    const parsed: unknown = JSON.parse(raw);
    if (isMemoryGraph(parsed) && parsed.memorySpaceId === memorySpaceId) return parsed;
  } catch {
    // Corrupt local state should not block a user from reviewing fresh candidates.
  }
  return newMemoryGraph(memorySpaceId);
}

function readReview(memorySpaceId: string): Record<string, MemoryDecision> {
  try {
    const raw = window.localStorage.getItem(memoryReviewStorageKey(memorySpaceId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<MemoryReviewState>;
    if (parsed.schemaVersion !== 1 || parsed.memorySpaceId !== memorySpaceId || !parsed.decisions) return {};
    return Object.fromEntries(
      Object.entries(parsed.decisions).filter(([, decision]) => decision === "KEEP" || decision === "SKIP"),
    );
  } catch {
    return {};
  }
}

export function MemoryCandidateReview({ memorySpaceId, stats, lore }: MemoryCandidateReviewProps) {
  const candidates = useMemo(
    () => buildConversationMemoryCandidates(memorySpaceId, stats, lore),
    [memorySpaceId, stats, lore],
  );
  const [graph, setGraph] = useState<MemoryGraph>(() => newMemoryGraph(memorySpaceId));
  const [decisions, setDecisions] = useState<Record<string, MemoryDecision>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const restoredGraph = readGraph(memorySpaceId);
    const restoredDecisions = readReview(memorySpaceId);
    const timer = window.setTimeout(() => {
      setGraph(restoredGraph);
      setDecisions(restoredDecisions);
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId]);

  function decide(candidateId: string, decision: MemoryDecision) {
    const memoryCandidate = candidates.find((item) => item.id === candidateId);
    if (!memoryCandidate) return;

    const nextGraph = applyMemoryDecision(graph, memoryCandidate, decision);
    const nextDecisions = { ...decisions, [candidateId]: decision };
    const review: MemoryReviewState = {
      schemaVersion: 1,
      memorySpaceId,
      decisions: nextDecisions,
      updatedAt: new Date().toISOString(),
    };

    setGraph(nextGraph);
    setDecisions(nextDecisions);
    window.localStorage.setItem(memoryGraphStorageKey(memorySpaceId), JSON.stringify(nextGraph));
    window.localStorage.setItem(memoryReviewStorageKey(memorySpaceId), JSON.stringify(review));
  }

  if (!loaded) return <div className="notice">Preparing your private memory candidates…</div>;

  const reviewedCount = Object.keys(decisions).length;
  const keptCount = graph.nodes.length;

  return (
    <section className={styles.wrap} aria-labelledby="memory-candidate-title">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Memory Miner · stays on this device</span>
          <h2 id="memory-candidate-title">Which moments belong in this memory?</h2>
          <p>
            ThreadTales found candidates from the conversation. Nothing becomes part of the Memory Graph until you choose <strong>Keep</strong>.
          </p>
        </div>
        <div className={styles.receipt} aria-live="polite">
          <strong>{keptCount}</strong> kept · {reviewedCount}/{candidates.length} reviewed
        </div>
      </div>

      <div className={styles.grid}>
        {candidates.map((candidate) => {
          const decision = decisions[candidate.id];
          return (
            <article className={styles.card} key={candidate.id} data-decision={decision ?? "PENDING"}>
              <div className={styles.meta}>
                <span>{candidate.kind.replaceAll("_", " ").toLowerCase()}</span>
                {candidate.containsPrivateText ? <span>private text</span> : <span>derived pattern</span>}
              </div>
              <h3>{candidate.title}</h3>
              <p>{candidate.detail}</p>
              {candidate.occurredAt ? (
                <time dateTime={candidate.occurredAt}>
                  {new Date(candidate.occurredAt).toLocaleDateString("en-US", { dateStyle: "medium" })}
                </time>
              ) : null}
              <div className={styles.actions}>
                <button
                  className={`btn ${decision === "KEEP" ? "btn-primary" : "btn-soft"}`}
                  type="button"
                  aria-pressed={decision === "KEEP"}
                  onClick={() => decide(candidate.id, "KEEP")}
                >
                  Keep
                </button>
                <button
                  className="btn btn-soft"
                  type="button"
                  aria-pressed={decision === "SKIP"}
                  onClick={() => decide(candidate.id, "SKIP")}
                >
                  Skip
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className={styles.footer}>
        <span>Raw chat stays local. Only memories you explicitly keep are written to this local Memory Graph.</span>
        <strong>{keptCount > 0 ? "Your graph has started." : "Keep at least one moment to start the graph."}</strong>
      </div>
    </section>
  );
}
