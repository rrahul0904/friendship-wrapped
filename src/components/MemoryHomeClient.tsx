"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createEmptyMemoryGraph,
  memoryGraphStorageKey,
  legacyProductMemorySpaceId,
  readStoredMemoryGraph,
  type MemoryGraph,
} from "@/lib/memory-graph";
import {
  MEMORY_SPACE_INDEX_KEY,
  isMemorySpaceManifestForId,
  memorySpaceStorageKey,
  type MemorySpaceManifest,
} from "@/lib/memory-platform";
import {
  MEMORY_DRAFT_STORAGE_KEY,
  MEMORY_INTENTS,
  isMemorySpaceDraft,
  recommendedIntents,
  type MemoryIntentKind,
} from "@/lib/memory-space";
import { composeMemoryStory, storyIntentTitle } from "@/lib/memory-story";
import { downloadStoryCard } from "@/platform/export/story-card";
import type { StoryChapter } from "@/platform/types";

const PRODUCT_SLUGS: Record<string, string> = {
  FRIENDSHIP: "friendship",
  RELATIONSHIP: "relationship",
  BABYSTORY: "babystory",
  FAMILYTREE: "familytree",
  PETLIFE: "petlife",
  HOMESTORY: "homestory",
};

function loadGraph(memorySpaceId: string) {
  return readStoredMemoryGraph(window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId)), memorySpaceId);
}

function downloadJson(filename: string, value: unknown) {
  const href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 500);
}

export function MemoryHomeClient({ memorySpaceId }: { memorySpaceId: string }) {
  const router = useRouter();
  const [manifest, setManifest] = useState<MemorySpaceManifest | null>(null);
  const [graph, setGraph] = useState<MemoryGraph | null>(null);
  const [recoveryData, setRecoveryData] = useState<string | null>(null);
  const [recoveryDownloaded, setRecoveryDownloaded] = useState(false);
  const [spaceChecked, setSpaceChecked] = useState(false);
  const [intent, setIntent] = useState<MemoryIntentKind>("MEMORY_LANE");
  const [dedication, setDedication] = useState("");
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(memorySpaceStorageKey(memorySpaceId));
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isMemorySpaceManifestForId(parsed, memorySpaceId)) {
            setManifest(parsed);
            const storedGraph = loadGraph(memorySpaceId);
            setGraph(storedGraph.graph);
            setRecoveryData(storedGraph.recoveryData);
            if (parsed.relationshipType) {
              const first = recommendedIntents(parsed.relationshipType)[0];
              if (first) setIntent(first.kind);
            }
          }
        }
      } catch {
        window.localStorage.removeItem(memorySpaceStorageKey(memorySpaceId));
      }
      setSpaceChecked(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId]);

  const intents = useMemo(() => {
    if (!manifest?.relationshipType) return MEMORY_INTENTS;
    const recommended = recommendedIntents(manifest.relationshipType);
    const recommendedKinds = new Set(recommended.map((item) => item.kind));
    return [...recommended, ...MEMORY_INTENTS.filter((item) => !recommendedKinds.has(item.kind))];
  }, [manifest]);

  const story = useMemo(() => {
    if (!manifest || !graph) return null;
    return composeMemoryStory({ graph, manifest, intent, dedication });
  }, [dedication, graph, intent, manifest]);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(0), 0);
    return () => window.clearTimeout(timer);
  }, [intent]);

  async function exportActiveBeat() {
    const beat = story?.beats[active];
    if (!beat) return;
    const chapter: StoryChapter = {
      id: beat.id,
      type: beat.role === "MEMORY" ? "timeline" : "closing",
      title: beat.title,
      subtitle: manifest?.name,
      supportingText: beat.body,
      privacyLevel: "safe",
      renderVariant: "timeline",
    };
    await downloadStoryCard(chapter, "vertical", true, "paper");
    setMessage("Downloaded the active 9:16 story card.");
  }

  function exportArchive() {
    if (!manifest || !graph || !story) return;
    downloadJson(`${manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "threadtales"}-memory-archive.json`, {
      version: 1,
      exportedAt: new Date().toISOString(),
      memorySpace: manifest,
      graph,
      story,
      note: "This archive contains approved memory metadata and story composition. Raw imported chat text and local media bytes are not included.",
    });
    setMessage("Downloaded your portable MemorySpace archive.");
  }

  function deleteMemorySpace() {
    const isPetLifeMirror = memorySpaceId === legacyProductMemorySpaceId("petlife");
    const prompt = isPetLifeMirror
      ? "Clear this PetLife Memory Graph mirror? The original PetLife timeline remains saved here and will rebuild the mirror when PetLife opens again. Delete the original timeline from PetLife if you want to remove it too."
      : `Delete “${manifest?.name ?? "this MemorySpace"}” and its approved memories from this browser? This cannot be undone. Export an archive first if you want to keep a copy.`;
    if (!manifest || !window.confirm(prompt)) return;

    window.localStorage.removeItem(memorySpaceStorageKey(memorySpaceId));
    window.localStorage.removeItem(memoryGraphStorageKey(memorySpaceId));

    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY) ?? "[]");
      if (Array.isArray(parsed)) {
        const remaining = parsed.filter((id): id is string => typeof id === "string" && id !== memorySpaceId);
        if (remaining.length) window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify(remaining));
        else window.localStorage.removeItem(MEMORY_SPACE_INDEX_KEY);
      } else {
        window.localStorage.removeItem(MEMORY_SPACE_INDEX_KEY);
      }
    } catch {
      window.localStorage.removeItem(MEMORY_SPACE_INDEX_KEY);
    }

    try {
      const rawDraft = window.localStorage.getItem(MEMORY_DRAFT_STORAGE_KEY);
      if (rawDraft) {
        const parsed: unknown = JSON.parse(rawDraft);
        if (isMemorySpaceDraft(parsed) && parsed.id === memorySpaceId) {
          window.localStorage.removeItem(MEMORY_DRAFT_STORAGE_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(MEMORY_DRAFT_STORAGE_KEY);
    }

    router.replace("/memory/new");
  }

  function downloadRecoveryCopy() {
    if (recoveryData === null) return;
    downloadJson(`${memorySpaceId}-memory-graph-recovery.json`, {
      schemaVersion: 1,
      memorySpaceId,
      recoveryData,
      note: "Original local graph data preserved before explicit recovery.",
    });
    setRecoveryDownloaded(true);
  }

  function replaceDamagedGraph() {
    if (!manifest || recoveryData === null || !recoveryDownloaded) return;
    if (!window.confirm("Replace this unreadable Memory Graph with an empty graph? The original graph remains available in the recovery file you downloaded.")) return;
    const emptyGraph = createEmptyMemoryGraph(memorySpaceId);
    window.localStorage.setItem(memoryGraphStorageKey(memorySpaceId), JSON.stringify(emptyGraph));
    setGraph(emptyGraph);
    setRecoveryData(null);
    setMessage("Started a new Memory Graph. Your recovery file remains in Downloads.");
  }

  async function shareStoryText() {
    if (!story) return;
    const memoryLines = story.beats.filter((beat) => beat.role === "MEMORY").slice(0, 3).map((beat) => `• ${beat.title}`).join("\n");
    const text = `${story.title} — ${story.subtitle}\n${memoryLines}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: story.title, text });
        setMessage("Opened your device share sheet.");
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(text);
    setMessage("Copied a share-safe story summary.");
  }

  if (!spaceChecked) {
    return <div className="notice">Opening your MemorySpace…</div>;
  }

  if (manifest && recoveryData !== null) {
    return <section className="story product-workspace" aria-labelledby="memory-recovery-title">
      <div className="chapter-head"><div>
        <span className="story-summary-kicker">MemorySpace recovery</span>
        <h2 id="memory-recovery-title">Your saved memories need attention.</h2>
        <p>The saved graph could not be read. Its original data is still preserved in this browser, and no new memories can be written until you choose how to continue.</p>
      </div></div>
      <div className="notice" role="status">Download a recovery copy first. Replacing the graph starts this MemorySpace with no approved memories; your download keeps the unreadable original data.</div>
      <div className="premium-actions">
        <button className="btn btn-primary" type="button" onClick={downloadRecoveryCopy}>Download recovery copy</button>
        <button className="btn btn-soft" type="button" onClick={replaceDamagedGraph} disabled={!recoveryDownloaded}>Replace with an empty graph</button>
        <Link className="btn btn-soft" href="/memory/new">Return to MemorySpaces</Link>
      </div>
    </section>;
  }

  if (!manifest || !graph) {
    return <div className="notice" role="status">This MemorySpace is not available in this browser. <Link href="/memory/new">Create a MemorySpace here</Link>.</div>;
  }

  const activeBeat = story?.beats[Math.min(active, Math.max(0, (story?.beats.length ?? 1) - 1))];
  const productSlug = PRODUCT_SLUGS[manifest.productTemplate];
  const intakeParams = new URLSearchParams({
    memorySpaceId: manifest.id,
    relationship: manifest.relationshipType ?? "OTHER",
    intent,
    template: manifest.productTemplate,
  }).toString();

  return (
    <div className="product-builder" data-memory-home={manifest.productTemplate}>
      <section className="story product-workspace">
        <div className="chapter-head">
          <div>
            <span className="story-summary-kicker">{manifest.productTemplate.replaceAll("_", " ")}</span>
            <h2>{manifest.name}</h2>
            <p>{graph.nodes.length} approved memor{graph.nodes.length === 1 ? "y" : "ies"} · {manifest.subjectType.toLowerCase()} MemorySpace</p>
          </div>
          <div className="premium-actions">
            {productSlug ? <Link className="btn btn-soft" href={`/products/${productSlug}`}>Open {productSlug} product</Link> : null}
            <button className="btn btn-soft" type="button" onClick={exportArchive}>Export my memories</button>
            <button className="btn btn-soft" type="button" onClick={deleteMemorySpace}>{memorySpaceId === legacyProductMemorySpaceId("petlife") ? "Clear Memory Graph mirror" : "Delete this MemorySpace"}</button>
          </div>
        </div>

        <div className="builder-card">
          <h3>Add another source</h3>
          <div className="premium-actions">
            {manifest.relationshipType !== "PET" && manifest.relationshipType !== "HOME" ? <Link className="btn btn-soft" href={`/create?${intakeParams}`}>Conversation</Link> : null}
            <Link className="btn btn-soft" href={`/memory/intake/photos-videos?${intakeParams}`}>Photos & videos</Link>
            <Link className="btn btn-soft" href={`/memory/intake/manual?${intakeParams}`}>Manual memory</Link>
          </div>
        </div>

        <div className="timeline-list" aria-label="Approved Memory Graph">
          {graph.nodes.length ? [...graph.nodes].sort((a, b) => (a.occurredAt ?? 0) - (b.occurredAt ?? 0)).map((node) => (
            <article key={node.id}>
              <div>
                <small>{node.kind.replaceAll("_", " ").toLowerCase()} · {node.source?.replaceAll("_", " ").toLowerCase() ?? "approved memory"}</small>
                <h3>{node.title}</h3>
                <p>{node.summary}</p>
                {node.people || node.place || node.extra ? <div className="metadata-list">{node.people ? <span>{node.people}</span> : null}{node.place ? <span>{node.place}</span> : null}{node.extra ? <span>{node.extra}</span> : null}</div> : null}
              </div>
            </article>
          )) : <div className="notice">This Memory Graph is empty. Add a conversation, a photo/video reference, or a memory in your own words.</div>}
        </div>
      </section>

      <section className="story chapter-deck" aria-label="Intent composer">
        <div className="chapter-head">
          <div>
            <span className="story-summary-kicker">Intent Composer</span>
            <h3>Turn the same memories into something for this moment.</h3>
            <p>Changing the intent changes composition, not the underlying Memory Graph.</p>
          </div>
        </div>
        <div className="builder-grid">
          <label>Story intent<select className="select" value={intent} onChange={(event) => setIntent(event.target.value as MemoryIntentKind)}>{intents.map((item) => <option key={item.kind} value={item.kind}>{item.label}</option>)}</select></label>
          <label>Your final words<input className="share-input" value={dedication} maxLength={320} onChange={(event) => setDedication(event.target.value)} placeholder={intent === "APOLOGY" ? "Write the apology in your own words…" : "Optional dedication"} /></label>
        </div>
        {story && activeBeat ? <>
          <div className="chapter-preview theme-rose" data-story-intent={intent}>
            <small>{storyIntentTitle(intent)}</small>
            <h3>{activeBeat.title}</h3>
            <p>{activeBeat.body}</p>
            <div className="chapter-privacy">Composed from approved memories only</div>
          </div>
          <div className="chapter-nav">
            <button className="btn btn-soft" disabled={active === 0} onClick={() => setActive((value) => Math.max(0, value - 1))}>← Previous</button>
            <div className="chapter-dots">{story.beats.map((beat, index) => <button key={beat.id} aria-label={`Open memory story chapter ${index + 1}`} className={index === active ? "active" : ""} onClick={() => setActive(index)} />)}</div>
            <button className="btn btn-soft" disabled={active === story.beats.length - 1} onClick={() => setActive((value) => Math.min(story.beats.length - 1, value + 1))}>Next →</button>
          </div>
          <div className="premium-actions">
            <button className="btn btn-primary" type="button" onClick={() => void exportActiveBeat()}>Download 9:16 card</button>
            <button className="btn btn-soft" type="button" onClick={() => void shareStoryText()}>Share safe summary</button>
          </div>
        </> : null}
        {message ? <div className="notice" role="status">{message}</div> : null}
      </section>
    </div>
  );
}
