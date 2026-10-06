"use client";

import { useEffect, useMemo, useState } from "react";
import {
  approveCandidateIntoGraph,
  buildConversationMemoryCandidates,
  createEmptyMemoryGraph,
  decideMemoryCandidate,
  memoryGraphStorageKey,
  type MemoryCandidate,
  type MemoryGraph,
} from "@/lib/memory-graph";
import type { ChatStats } from "@/lib/types";

function isStoredGraph(value: unknown, memorySpaceId: string): value is MemoryGraph {
  if (!value || typeof value !== "object") return false;
  const graph = value as Partial<MemoryGraph>;
  return graph.schemaVersion === 1 && graph.memorySpaceId === memorySpaceId && Array.isArray(graph.nodes);
}

export function MemoryCandidateReview({ memorySpaceId, stats }: { memorySpaceId: string; stats: ChatStats }) {
  const initialCandidates = useMemo(
    () => buildConversationMemoryCandidates(memorySpaceId, stats),
    [memorySpaceId, stats],
  );
  const [candidates, setCandidates] = useState<MemoryCandidate[]>(initialCandidates);
  const [graph, setGraph] = useState<MemoryGraph>(() => createEmptyMemoryGraph(memorySpaceId));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (!isStoredGraph(parsed, memorySpaceId)) return;
        setGraph(parsed);
        const approvedIds = new Set(parsed.nodes.map((node) => node.sourceCandidateId));
        setCandidates((current) => current.map((candidate) =>
          approvedIds.has(candidate.id) ? { ...candidate, status: "APPROVED" as const } : candidate,
        ));
      } catch {
        window.localStorage.removeItem(memoryGraphStorageKey(memorySpaceId));
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId]);

  function keep(candidate: MemoryCandidate) {
    const approvedCandidates = decideMemoryCandidate(candidates, candidate.id, "APPROVED");
    const approved = approvedCandidates.find((item) => item.id === candidate.id);
    if (!approved) return;
    const nextGraph = approveCandidateIntoGraph(graph, approved);
    setCandidates(approvedCandidates);
    setGraph(nextGraph);
    window.localStorage.setItem(memoryGraphStorageKey(memorySpaceId), JSON.stringify(nextGraph));
  }

  function skip(candidate: MemoryCandidate) {
    setCandidates((current) => decideMemoryCandidate(current, candidate.id, "REJECTED"));
  }

  const approvedCount = graph.nodes.length;
  const pending = candidates.filter((candidate) => candidate.status === "PENDING");

  return (
    <section className="story" aria-labelledby="memory-candidates-title">
      <div className="story-heading">
        <span className="eyebrow">Memory Miner</span>
        <h2 id="memory-candidates-title">We found moments worth reviewing.</h2>
        <p>These are derived from measurable conversation patterns. Nothing becomes part of this MemorySpace until you choose Keep.</p>
      </div>

      <div className="notice" role="status">
        {approvedCount} kept in this browser · {pending.length} still to review
      </div>

      <div className="chapter-grid">
        {candidates.map((candidate) => (
          <article className="story" key={candidate.id} data-memory-candidate={candidate.kind}>
            <span className="eyebrow">{candidate.kind.replaceAll("_", " ").toLowerCase()}</span>
            <h3>{candidate.title}</h3>
            <p>{candidate.summary}</p>
            <div className="controls">
              {candidate.status === "PENDING" ? (
                <>
                  <button className="btn btn-primary" type="button" onClick={() => keep(candidate)}>Keep</button>
                  <button className="btn btn-soft" type="button" onClick={() => skip(candidate)}>Skip</button>
                </>
              ) : (
                <span>{candidate.status === "APPROVED" ? "✓ Kept in Memory Graph" : "Skipped"}</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <p className="notice">This slice stores only approved derived memory nodes in local browser storage. Raw chat text is not copied into the Memory Graph.</p>
    </section>
  );
}
