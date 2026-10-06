"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { MemoryIntentKind } from "@/lib/memory-space";
import { isMemoryGraph, memoryGraphStorageKey, newMemoryGraph, type MemoryGraph } from "@/lib/memory-graph";
import {
  deleteMemoryMedia,
  isMemoryStudioDraft,
  listMemoryMedia,
  newMemoryStudioDraft,
  saveMemoryMediaFiles,
  studioDraftStorageKey,
  type MemoryMediaRecord,
  type MemoryStudioDraft,
} from "@/lib/memory-media";
import { composeMemoryStory, type StoryBeat } from "@/lib/memory-story";
import styles from "./MemoryStudio.module.css";

interface RenderedMedia extends MemoryMediaRecord {
  objectUrl: string;
}

type StudioSlide =
  | { id: string; type: "STORY"; beat: StoryBeat }
  | { id: string; type: "MEDIA"; asset: RenderedMedia };

function readGraph(memorySpaceId: string): MemoryGraph {
  try {
    const raw = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
    if (!raw) return newMemoryGraph(memorySpaceId);
    const parsed: unknown = JSON.parse(raw);
    if (isMemoryGraph(parsed) && parsed.memorySpaceId === memorySpaceId) return parsed;
  } catch {
    // An invalid local graph should not block a media-only MemorySpace.
  }
  return newMemoryGraph(memorySpaceId);
}

function readStudioDraft(memorySpaceId: string, intent: MemoryIntentKind): MemoryStudioDraft {
  try {
    const raw = window.localStorage.getItem(studioDraftStorageKey(memorySpaceId, intent));
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isMemoryStudioDraft(parsed) && parsed.memorySpaceId === memorySpaceId && parsed.intent === intent) return parsed;
    }
  } catch {
    // Fall back to a clean local draft.
  }
  return newMemoryStudioDraft(memorySpaceId, intent);
}

export function MemoryStudio({ memorySpaceId, intent }: { memorySpaceId: string; intent: MemoryIntentKind }) {
  const [graph, setGraph] = useState<MemoryGraph>(() => newMemoryGraph(memorySpaceId));
  const [draft, setDraft] = useState<MemoryStudioDraft>(() => newMemoryStudioDraft(memorySpaceId, intent));
  const [media, setMedia] = useState<RenderedMedia[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [error, setError] = useState("");
  const [slideIndex, setSlideIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refreshMedia() {
    const records = await listMemoryMedia(memorySpaceId);
    setMedia((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.objectUrl));
      return records.map((record) => ({ ...record, objectUrl: URL.createObjectURL(record.blob) }));
    });
  }

  useEffect(() => {
    const restoredGraph = readGraph(memorySpaceId);
    const restoredDraft = readStudioDraft(memorySpaceId, intent);
    const timer = window.setTimeout(() => {
      setGraph(restoredGraph);
      setDraft(restoredDraft);
      void refreshMedia().finally(() => setLoaded(true));
    }, 0);
    return () => window.clearTimeout(timer);
    // refreshMedia is intentionally bound to this MemorySpace load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memorySpaceId, intent]);

  useEffect(() => () => {
    media.forEach((item) => URL.revokeObjectURL(item.objectUrl));
  }, [media]);

  useEffect(() => {
    if (!loaded) return;
    const next = { ...draft, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(studioDraftStorageKey(memorySpaceId, intent), JSON.stringify(next));
  }, [draft, intent, loaded, memorySpaceId]);

  const plan = useMemo(() => composeMemoryStory(graph, intent), [graph, intent]);

  const slides = useMemo<StudioSlide[]>(() => {
    const storySlides: StudioSlide[] = plan.beats.map((beat) => ({ id: `story-${beat.id}`, type: "STORY", beat }));
    const mediaSlides: StudioSlide[] = media.map((asset) => ({ id: `media-${asset.id}`, type: "MEDIA", asset }));
    if (mediaSlides.length === 0) return storySlides;
    const opening = storySlides.slice(0, 1);
    const rest = storySlides.slice(1);
    return [...opening, ...mediaSlides, ...rest];
  }, [media, plan]);

  useEffect(() => {
    if (slideIndex < slides.length) return;
    const timer = window.setTimeout(() => setSlideIndex(Math.max(0, slides.length - 1)), 0);
    return () => window.clearTimeout(timer);
  }, [slideIndex, slides.length]);

  async function addMedia(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !memorySpaceId) return;
    setMediaBusy(true);
    setError("");
    try {
      await saveMemoryMediaFiles(memorySpaceId, files);
      await refreshMedia();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that media locally.");
    } finally {
      setMediaBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeMedia(assetId: string) {
    setMediaBusy(true);
    setError("");
    try {
      await deleteMemoryMedia(assetId);
      await refreshMedia();
    } catch {
      setError("Could not remove that local media item.");
    } finally {
      setMediaBusy(false);
    }
  }

  function updateDraft(patch: Partial<MemoryStudioDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function updateSoundtrack(field: "title" | "artist" | "url", value: string) {
    setDraft((current) => ({
      ...current,
      soundtrack: { ...current.soundtrack, [field]: value },
    }));
  }

  if (!memorySpaceId) {
    return (
      <main className={styles.page}>
        <section className={styles.empty}>
          <p className={styles.eyebrow}>Memory Studio</p>
          <h1>This studio needs a MemorySpace.</h1>
          <Link href="/memory/new" className={styles.primary}>Create a MemorySpace</Link>
        </section>
      </main>
    );
  }

  if (!loaded) {
    return <main className={styles.page}><div className={styles.loading}>Opening your local Memory Studio…</div></main>;
  }

  const currentSlide = slides[Math.min(slideIndex, Math.max(0, slides.length - 1))];
  const dedicationForBeat = (beat: StoryBeat) => beat.source === "USER_REQUIRED" && draft.dedication.trim() ? draft.dedication.trim() : beat.body;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.brand}>ThreadTales</Link>
        <span>Memory Studio · local prototype</span>
      </header>

      <div className={styles.layout}>
        <section className={styles.controls}>
          <div>
            <p className={styles.eyebrow}>Memory Studio</p>
            <h1>Shape the memory. Don’t edit a movie.</h1>
            <p className={styles.lede}>Add the pieces that matter. ThreadTales keeps the composition constrained so the story stays simple.</p>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <div><strong>Photos & videos</strong><span>{media.length} saved in this browser</span></div>
              <button type="button" className={styles.softButton} onClick={() => fileRef.current?.click()} disabled={mediaBusy}>{mediaBusy ? "Saving…" : "Add media"}</button>
            </div>
            <input ref={fileRef} className={styles.fileInput} type="file" accept="image/*,video/*" multiple onChange={addMedia} />
            {media.length ? (
              <div className={styles.mediaGrid}>
                {media.map((asset) => (
                  <div className={styles.thumb} key={asset.id}>
                    {asset.kind === "IMAGE" ? <img src={asset.objectUrl} alt={asset.name} /> : <video src={asset.objectUrl} muted playsInline />}
                    <button type="button" onClick={() => void removeMedia(asset.id)} aria-label={`Remove ${asset.name}`}>×</button>
                    <span>{asset.name}</span>
                  </div>
                ))}
              </div>
            ) : <p className={styles.hint}>Nothing is uploaded. Selected media is stored in browser IndexedDB for this MemorySpace.</p>}
          </div>

          <div className={styles.panel}>
            <label className={styles.field}>
              <span>Your dedication</span>
              <textarea
                rows={4}
                value={draft.dedication}
                maxLength={600}
                placeholder="Write the part that only you can say…"
                onChange={(event) => updateDraft({ dedication: event.target.value })}
              />
            </label>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHead}><div><strong>Soundtrack reference</strong><span>Reference only — not licensed export audio</span></div></div>
            <div className={styles.soundtrackGrid}>
              <label className={styles.field}><span>Song</span><input value={draft.soundtrack.title} onChange={(event) => updateSoundtrack("title", event.target.value)} placeholder="Our song" /></label>
              <label className={styles.field}><span>Artist</span><input value={draft.soundtrack.artist} onChange={(event) => updateSoundtrack("artist", event.target.value)} placeholder="Artist" /></label>
            </div>
            <label className={styles.field}><span>Optional song link</span><input value={draft.soundtrack.url} onChange={(event) => updateSoundtrack("url", event.target.value)} placeholder="Spotify / Apple Music / other reference" /></label>
            <p className={styles.hint}>ThreadTales may use this reference for the private experience where permitted. It does not imply the track may be embedded into an exported MP4.</p>
          </div>

          {error ? <div className={styles.error} role="alert">{error}</div> : null}
        </section>

        <aside className={styles.previewColumn}>
          <div className={styles.previewHeader}>
            <div><span>{plan.title}</span><strong>{slideIndex + 1}/{Math.max(1, slides.length)}</strong></div>
            {draft.soundtrack.title ? <small>♫ {draft.soundtrack.title}{draft.soundtrack.artist ? ` — ${draft.soundtrack.artist}` : ""}</small> : <small>No soundtrack selected</small>}
          </div>

          <div className={styles.phone} aria-label="9:16 Memory Story preview">
            {currentSlide?.type === "MEDIA" ? (
              <div className={styles.mediaSlide}>
                {currentSlide.asset.kind === "IMAGE" ? (
                  <img src={currentSlide.asset.objectUrl} alt={currentSlide.asset.name} />
                ) : (
                  <video src={currentSlide.asset.objectUrl} controls playsInline preload="metadata" />
                )}
                <div className={styles.mediaCaption}>{currentSlide.asset.name}</div>
              </div>
            ) : currentSlide?.type === "STORY" ? (
              <div className={styles.storySlide} data-source={currentSlide.beat.source}>
                <span>{currentSlide.beat.kind.toLowerCase()}</span>
                <h2>{currentSlide.beat.title}</h2>
                {dedicationForBeat(currentSlide.beat) ? <p>{dedicationForBeat(currentSlide.beat)}</p> : null}
                {currentSlide.beat.source === "USER_REQUIRED" && !draft.dedication.trim() ? <em>Your words go here.</em> : null}
              </div>
            ) : (
              <div className={styles.storySlide}><h2>Add a memory to begin.</h2></div>
            )}
          </div>

          <div className={styles.nav}>
            <button type="button" onClick={() => setSlideIndex((value) => Math.max(0, value - 1))} disabled={slideIndex === 0}>← Previous</button>
            <button type="button" onClick={() => setSlideIndex((value) => Math.min(Math.max(0, slides.length - 1), value + 1))} disabled={slideIndex >= slides.length - 1}>Next →</button>
          </div>

          <div className={styles.receipt}>
            <strong>Local-first receipt</strong>
            <span>{graph.nodes.length} approved graph memories · {media.length} local media items</span>
            <span>Dedication and soundtrack reference stay in this browser in this slice.</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
