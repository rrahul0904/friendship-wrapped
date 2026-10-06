"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createDirectMemoryNode,
  createEmptyMemoryGraph,
  memoryGraphStorageKey,
  upsertMemoryNode,
  type MemoryGraph,
  type MemoryNodeKind,
} from "@/lib/memory-graph";
import {
  isMemorySpaceManifest,
  memorySpaceHomeHref,
  memorySpaceStorageKey,
  type MemorySpaceManifest,
} from "@/lib/memory-platform";

function loadGraph(memorySpaceId: string): MemoryGraph {
  try {
    const raw = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
    if (!raw) return createEmptyMemoryGraph(memorySpaceId);
    const parsed = JSON.parse(raw) as Partial<MemoryGraph>;
    if (parsed.schemaVersion === 1 && parsed.memorySpaceId === memorySpaceId && Array.isArray(parsed.nodes)) {
      return parsed as MemoryGraph;
    }
  } catch {
    window.localStorage.removeItem(memoryGraphStorageKey(memorySpaceId));
  }
  return createEmptyMemoryGraph(memorySpaceId);
}

function dateToTimestamp(date: string) {
  if (!date) return null;
  const timestamp = Date.parse(`${date}T12:00:00`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function MemoryIntakeClient({ source }: { source: "manual" | "photos-videos" }) {
  const search = useSearchParams();
  const memorySpaceId = search.get("memorySpaceId") ?? "";
  const [manifest, setManifest] = useState<MemorySpaceManifest | null>(null);
  const [graph, setGraph] = useState<MemoryGraph | null>(null);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kind, setKind] = useState<MemoryNodeKind>("MANUAL_MEMORY");
  const [note, setNote] = useState("");
  const [people, setPeople] = useState("");
  const [place, setPlace] = useState("");
  const [extra, setExtra] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!memorySpaceId) return;
    const timer = window.setTimeout(() => {
      try {
        const rawManifest = window.localStorage.getItem(memorySpaceStorageKey(memorySpaceId));
        if (rawManifest) {
          const parsed: unknown = JSON.parse(rawManifest);
          if (isMemorySpaceManifest(parsed)) setManifest(parsed);
        }
      } catch {
        window.localStorage.removeItem(memorySpaceStorageKey(memorySpaceId));
      }
      setGraph(loadGraph(memorySpaceId));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId]);

  const homeHref = useMemo(
    () => memorySpaceId ? memorySpaceHomeHref(memorySpaceId) : "/memory/new",
    [memorySpaceId],
  );

  function saveGraph(next: MemoryGraph) {
    setGraph(next);
    window.localStorage.setItem(memoryGraphStorageKey(next.memorySpaceId), JSON.stringify(next));
  }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!graph || !memorySpaceId || !title.trim()) return;
    const node = createDirectMemoryNode({
      id: `${memorySpaceId}:manual:${crypto.randomUUID()}`,
      memorySpaceId,
      kind,
      title,
      summary: note || "Memory added by you.",
      occurredAt: dateToTimestamp(date),
      source: "MANUAL",
      productTemplate: manifest?.productTemplate,
      people,
      place,
      extra,
      facts: { date },
    });
    saveGraph(upsertMemoryNode(graph, node));
    setTitle("");
    setNote("");
    setPeople("");
    setPlace("");
    setExtra("");
    setMessage("Memory kept in this Memory Graph.");
  }

  function keepMediaMetadata() {
    if (!graph || !memorySpaceId || !files.length) return;
    let next = graph;
    for (const file of files.slice(0, 24)) {
      const node = createDirectMemoryNode({
        id: `${memorySpaceId}:media:${crypto.randomUUID()}`,
        memorySpaceId,
        kind: "PHOTO_VIDEO",
        title: file.name,
        summary: `${file.type.startsWith("video/") ? "Video" : "Photo"} selected by you. Media bytes remain on this device in this preview slice.`,
        occurredAt: file.lastModified || null,
        source: "MEDIA_METADATA",
        productTemplate: manifest?.productTemplate,
        facts: {
          fileName: file.name,
          mimeType: file.type || "unknown",
          sizeBytes: file.size,
          lastModified: file.lastModified || null,
        },
      });
      next = upsertMemoryNode(next, node);
    }
    saveGraph(next);
    setMessage(`${files.slice(0, 24).length} media reference${files.length === 1 ? "" : "s"} kept in the Memory Graph. File bytes were not copied into localStorage.`);
    setFiles([]);
  }

  if (!memorySpaceId) {
    return <div className="notice">This intake needs a MemorySpace. <Link href="/memory/new">Create one first.</Link></div>;
  }

  if (!graph) return <div className="notice">Opening your local MemorySpace…</div>;

  return (
    <div className="product-builder" data-memory-intake={source}>
      <section className="story product-workspace">
        <div className="chapter-head">
          <div>
            <span className="story-summary-kicker">{manifest?.productTemplate ?? "Memory Keeper"}</span>
            <h2>{manifest?.name ?? "Your MemorySpace"}</h2>
            <p>{graph.nodes.length} approved memor{graph.nodes.length === 1 ? "y" : "ies"} already live in this graph.</p>
          </div>
          <Link className="btn btn-soft" href={homeHref}>Open memory home →</Link>
        </div>

        {source === "manual" ? (
          <form className="builder-card" onSubmit={submitManual}>
            <h3>Add a memory in your own words</h3>
            <p className="notice">Because you are authoring this memory directly, saving it is the approval action. ThreadTales does not reinterpret it before it enters the graph.</p>
            <div className="builder-grid">
              <label>Memory title<input className="share-input" value={title} maxLength={140} onChange={(event) => setTitle(event.target.value)} placeholder="The day we moved in" required /></label>
              <label>Date<input className="share-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label>Kind<select className="select" value={kind} onChange={(event) => setKind(event.target.value as MemoryNodeKind)}><option value="MANUAL_MEMORY">Memory</option><option value="MILESTONE">Milestone</option><option value="PLACE">Place / trip</option><option value="SONG">Song</option><option value="PERSON">Person / family story</option><option value="PROJECT">Project / home chapter</option></select></label>
              <label>People<input className="share-input" value={people} maxLength={120} onChange={(event) => setPeople(event.target.value)} placeholder="Optional" /></label>
              <label>Place<input className="share-input" value={place} maxLength={120} onChange={(event) => setPlace(event.target.value)} placeholder="Optional" /></label>
              <label>Song / detail<input className="share-input" value={extra} maxLength={160} onChange={(event) => setExtra(event.target.value)} placeholder="Optional" /></label>
            </div>
            <label>What do you want to remember?<textarea className="share-input" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} rows={4} /></label>
            <div className="premium-actions"><button className="btn btn-primary" type="submit">Keep this memory</button><Link className="btn btn-soft" href={homeHref}>Done for now</Link></div>
          </form>
        ) : (
          <div className="builder-card">
            <h3>Choose photos & videos</h3>
            <p className="notice">This preview slice keeps only the metadata you explicitly approve. Browser-selected photo/video bytes are not stored in localStorage or uploaded.</p>
            <label className="file-drop">Local media<input aria-label="Choose memory photos and videos" type="file" accept="image/*,video/*" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 24))} /><span>{files.length ? `${files.length} item${files.length === 1 ? "" : "s"} ready for review` : "Choose up to 24 files"}</span></label>
            {files.length ? <div className="timeline-list" aria-label="Selected media metadata">{files.map((file) => <article key={`${file.name}-${file.lastModified}-${file.size}`}><div><small>{file.type || "file"} · {(file.size / 1024 / 1024).toFixed(1)} MB</small><h3>{file.name}</h3><p>{file.lastModified ? `Last modified ${new Date(file.lastModified).toLocaleDateString()}` : "No file date available"}</p></div></article>)}</div> : null}
            <div className="premium-actions"><button className="btn btn-primary" type="button" disabled={!files.length} onClick={keepMediaMetadata}>Keep selected references</button><Link className="btn btn-soft" href={homeHref}>Done for now</Link></div>
          </div>
        )}

        {message ? <div className="notice" role="status">{message}</div> : null}
      </section>
    </div>
  );
}
