"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  approveCandidateIntoGraph,
  buildConversationMemoryCandidates,
  createEmptyMemoryGraph,
  decideMemoryCandidate,
  memoryGraphStorageKey,
  readStoredMemoryGraph,
  type MemoryCandidate,
  type MemoryGraph,
} from "@/lib/memory-graph";
import { memorySpaceHomeHref } from "@/lib/memory-platform";
import type { ChatStats } from "@/lib/types";

export function MemoryCandidateReview({ memorySpaceId, stats }: { memorySpaceId: string; stats: ChatStats }) {
  const initialCandidates = useMemo(
    () => buildConversationMemoryCandidates(memorySpaceId, stats),
    [memorySpaceId, stats],
  );
  const [candidates, setCandidates] = useState<MemoryCandidate[]>(initialCandidates);
  const [graph, setGraph] = useState<MemoryGraph>(() => createEmptyMemoryGraph(memorySpaceId));
  const [graphLoaded, setGraphLoaded] = useState(false);
  const [graphNeedsRecovery, setGraphNeedsRecovery] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
        const result = readStoredMemoryGraph(stored, memorySpaceId);
        if (result.graph) {
          setGraph(result.graph);
          const approvedIds = new Set(result.graph.nodes.map((node) => node.sourceCandidateId).filter(Boolean));
            setCandidates((current) => current.map((candidate) =>
              approvedIds.has(candidate.id) ? { ...candidate, status: "APPROVED" as const } : candidate,
            ));
        } else {
          setGraphNeedsRecovery(true);
        }
      } catch {
        setGraphNeedsRecovery(true);
      }
      setGraphLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId]);

  function keep(candidate: MemoryCandidate) {
    if (!graphLoaded || graphNeedsRecovery) return;
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

  const approvedCount = graphLoaded ? graph.nodes.length : 0;
  const pending = candidates.filter((candidate) => candidate.status === "PENDING");

  return (
    <section className="story" aria-labelledby="memory-candidates-title">
      <div className="story-heading">
        <span className="eyebrow">Memory Miner</span>
        <h2 id="memory-candidates-title">We found moments worth reviewing.</h2>
        <p>These are derived from measurable conversation patterns. Nothing becomes part of this MemorySpace until you choose Keep.</p>
      </div>

      <div className="notice" role="status">
        {graphNeedsRecovery
          ? <>Your saved Memory Graph could not be read. The original data is still in this browser; open the <Link href={memorySpaceHomeHref(memorySpaceId)}>MemorySpace recovery screen</Link> before adding memories.</>
          : graphLoaded ? `${approvedCount} kept in this browser · ${pending.length} still to review` : "Opening your saved MemorySpace…"}
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
                  <button className="btn btn-primary" type="button" onClick={() => keep(candidate)} disabled={!graphLoaded || graphNeedsRecovery}>Keep</button>
                  <button className="btn btn-soft" type="button" onClick={() => skip(candidate)}>Skip</button>
                </>
              ) : (
                <span>{candidate.status === "APPROVED" ? "✓ Kept in Memory Graph" : "Skipped"}</span>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="premium-actions">
        <Link className="btn btn-primary" href={memorySpaceHomeHref(memorySpaceId)}>Open MemorySpace →</Link>
      </div>
      <p className="notice">Only approved derived nodes enter the Memory Graph. Raw chat text is not copied into the graph.</p>
    </section>
  );
}
