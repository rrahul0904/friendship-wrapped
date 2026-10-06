"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { memoryGraphStorageKey, type MemoryGraph, type MemoryNode } from "@/lib/memory-graph";
import {
  MEMORY_SPACE_INDEX_KEY,
  isMemorySpaceManifest,
  memorySpaceHomeHref,
  memorySpaceStorageKey,
  type MemoryLens,
  type MemorySpaceManifest,
} from "@/lib/memory-platform";

type LoadedSpace = { manifest: MemorySpaceManifest; graph: MemoryGraph };

function loadSpaces(): LoadedSpace[] {
  try {
    const rawIndex = window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY);
    const parsed: unknown = rawIndex ? JSON.parse(rawIndex) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    const spaces: LoadedSpace[] = [];
    for (const id of ids) {
      const rawManifest = window.localStorage.getItem(memorySpaceStorageKey(id));
      const rawGraph = window.localStorage.getItem(memoryGraphStorageKey(id));
      if (!rawManifest || !rawGraph) continue;
      const manifestValue: unknown = JSON.parse(rawManifest);
      const graphValue = JSON.parse(rawGraph) as Partial<MemoryGraph>;
      if (!isMemorySpaceManifest(manifestValue)) continue;
      if (graphValue.schemaVersion !== 1 || graphValue.memorySpaceId !== id || !Array.isArray(graphValue.nodes)) continue;
      spaces.push({ manifest: manifestValue, graph: graphValue as MemoryGraph });
    }
    return spaces;
  } catch {
    return [];
  }
}

function yearForNode(node: MemoryNode) {
  if (!node.occurredAt) return null;
  return new Date(node.occurredAt).getFullYear();
}

export function MemoryLensPanel({ lens }: { lens: MemoryLens }) {
  const [spaces, setSpaces] = useState<LoadedSpace[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const timer = window.setTimeout(() => setSpaces(loadSpaces()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const allNodes = useMemo(() => spaces.flatMap((space) => space.graph.nodes.map((node) => ({ node, manifest: space.manifest }))), [spaces]);
  const availableYears = useMemo(() => [...new Set(allNodes.map(({ node }) => yearForNode(node)).filter((value): value is number => value !== null))].sort((a, b) => b - a), [allNodes]);
  const yearNodes = useMemo(() => allNodes.filter(({ node }) => yearForNode(node) === year).sort((a, b) => (a.node.occurredAt ?? 0) - (b.node.occurredAt ?? 0)), [allNodes, year]);
  const placeNodes = useMemo(() => allNodes.filter(({ node }) => Boolean(node.place)).sort((a, b) => (a.node.occurredAt ?? 0) - (b.node.occurredAt ?? 0)), [allNodes]);

  if (!spaces.length) {
    return <section className="story product-workspace"><div className="chapter-head"><div><span className="story-summary-kicker">Shared Memory Graph</span><h2>{lens === "LIFEMAP" ? "LifeMap is ready to become a cross-space lens." : "MyYear is ready to compose from your MemorySpaces."}</h2><p>Create or migrate a MemorySpace first. This lens does not invent a second copy of your memories.</p></div><Link className="btn btn-primary" href="/memory/new">Create a MemorySpace →</Link></div></section>;
  }

  return <section className="story product-workspace" data-memory-lens={lens}>
    <div className="chapter-head">
      <div>
        <span className="story-summary-kicker">Shared Memory Graph · {lens === "LIFEMAP" ? "LifeMap" : "MyYear"}</span>
        <h2>{lens === "LIFEMAP" ? "One life view across the memories you already keep." : "A year composed from memories you already approved."}</h2>
        <p>{spaces.length} MemorySpace{spaces.length === 1 ? "" : "s"} · {allNodes.length} approved memor{allNodes.length === 1 ? "y" : "ies"}. No duplicate memory store is created.</p>
      </div>
    </div>

    {lens === "MYYEAR" ? <div className="builder-card">
      <label>Year<select className="select" value={year} onChange={(event) => setYear(Number(event.target.value))}>{(availableYears.length ? availableYears : [year]).map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <div className="timeline-list" aria-label={`${year} shared memories`}>{yearNodes.length ? yearNodes.map(({ node, manifest }) => <article key={`${manifest.id}-${node.id}`}><div><small>{manifest.name} · {node.kind.replaceAll("_", " ").toLowerCase()}</small><h3>{node.title}</h3><p>{node.summary}</p></div><Link className="btn btn-soft" href={memorySpaceHomeHref(manifest.id)}>Open</Link></article>) : <div className="notice">No approved memories with dates in {year} yet.</div>}</div>
    </div> : <>
      <div className="timeline-list" aria-label="LifeMap place memories">{placeNodes.length ? placeNodes.map(({ node, manifest }) => <article key={`${manifest.id}-${node.id}`}><div><small>{node.place} · {manifest.name}</small><h3>{node.title}</h3><p>{node.summary}</p></div><Link className="btn btn-soft" href={memorySpaceHomeHref(manifest.id)}>Open</Link></article>) : <div className="notice">No approved memories have a place yet. Add places to manual or migrated product memories and LifeMap will pick them up automatically.</div>}</div>
      <div className="builder-card"><h3>MemorySpaces feeding this LifeMap</h3><div className="premium-actions">{spaces.map(({ manifest }) => <Link key={manifest.id} className="btn btn-soft" href={memorySpaceHomeHref(manifest.id)}>{manifest.name}</Link>)}</div></div>
    </>}
  </section>;
}
