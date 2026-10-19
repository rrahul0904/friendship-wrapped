"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { composeBurstFrames, burstFrameDurationMs, nextBurstIndex } from "@/lib/memory-burst";
import { isMemoryGraph, memoryGraphStorageKey, newMemoryGraph, type MemoryGraph } from "@/lib/memory-graph";
import {
  isMemoryStudioDraft, listMemoryMedia, newMemoryStudioDraft, studioDraftStorageKey,
  type MemoryMediaRecord, type MemoryStudioDraft,
} from "@/lib/memory-media";
import type { MemoryIntentKind } from "@/lib/memory-space";
import { composeMemoryStory } from "@/lib/memory-story";
import styles from "./MemoryBurst.module.css";

interface LocalAsset extends MemoryMediaRecord { objectUrl: string }

function loadGraph(spaceId: string): MemoryGraph {
  try {
    const raw = localStorage.getItem(memoryGraphStorageKey(spaceId));
    if (raw) {
      const decoded: unknown = JSON.parse(raw);
      if (isMemoryGraph(decoded) && decoded.memorySpaceId === spaceId) return decoded;
    }
  } catch { /* A damaged graph does not erase any media. */ }
  return newMemoryGraph(spaceId);
}

function loadDraft(spaceId: string, intent: MemoryIntentKind): MemoryStudioDraft {
  try {
    const raw = localStorage.getItem(studioDraftStorageKey(spaceId, intent));
    if (raw) {
      const decoded: unknown = JSON.parse(raw);
      if (isMemoryStudioDraft(decoded) && decoded.memorySpaceId === spaceId && decoded.intent === intent) return decoded;
    }
  } catch { /* Use an unsaved draft, without overwriting malformed content. */ }
  return newMemoryStudioDraft(spaceId, intent);
}

export function MemoryBurst({ memorySpaceId, intent }: { memorySpaceId: string; intent: MemoryIntentKind }) {
  const [graph, setGraph] = useState<MemoryGraph>(() => newMemoryGraph(memorySpaceId));
  const [draft, setDraft] = useState<MemoryStudioDraft>(() => newMemoryStudioDraft(memorySpaceId, intent));
  const [assets, setAssets] = useState<LocalAsset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [frameIndex, setFrameIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!memorySpaceId) return;
    let cancelled = false;
    const graphFromBrowser = loadGraph(memorySpaceId);
    const draftFromBrowser = loadDraft(memorySpaceId, intent);
    void listMemoryMedia(memorySpaceId).then((records) => {
      if (cancelled) return;
      const localAssets = records.map((asset) => ({ ...asset, objectUrl: URL.createObjectURL(asset.blob) }));
      setGraph(graphFromBrowser);
      setDraft(draftFromBrowser);
      setAssets(localAssets);
      setLoaded(true);
    }).catch(() => {
      if (!cancelled) {
        setError("Cannot open this browser's local media. Check storage permissions and try again.");
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [memorySpaceId, intent]);

  useEffect(() => () => {
    assets.forEach((asset) => URL.revokeObjectURL(asset.objectUrl));
  }, [assets]);

  const plan = useMemo(() => composeMemoryStory(graph, intent), [graph, intent]);
  const frames = useMemo(() => composeBurstFrames(plan.beats, assets, draft.dedication), [plan, assets, draft.dedication]);
  const visibleIndex = Math.min(frameIndex, Math.max(0, frames.length - 1));
  const currentFrame = frames[visibleIndex];
  const mediaLookup = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const currentAsset = currentFrame?.kind === "PHOTO" || currentFrame?.kind === "VIDEO"
    ? mediaLookup.get(currentFrame.assetId) : undefined;
  const studioUrl = `/memory/studio?memorySpaceId=${encodeURIComponent(memorySpaceId)}&intent=${encodeURIComponent(intent)}`;

  useEffect(() => {
    if (!playing || !currentFrame) return;
    const duration = burstFrameDurationMs(currentFrame);
    if (duration === null) return;
    const timer = window.setTimeout(() => {
      const next = nextBurstIndex(visibleIndex, frames.length);
      if (next === null) setPlaying(false);
      else setFrameIndex(next);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [playing, currentFrame, visibleIndex, frames.length]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) { video.pause(); return; }
    // Muted autoplay works more reliably on mobile; viewers can unmute.
    void video.play().catch(() => setPlaying(false));
  }, [playing, visibleIndex, loaded]);

  function advance() {
    const next = nextBurstIndex(visibleIndex, frames.length);
    if (next === null) setPlaying(false);
    else setFrameIndex(next);
  }

  if (!memorySpaceId) {
    return <main className={styles.page}><div className={styles.empty}><h1>Choose a MemorySpace first.</h1><Link href="/memory/new">Create a memory</Link></div></main>;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href={studioUrl} className={styles.back}>← Back to Memory Studio</Link>
        <span>ThreadTales · Memory Burst</span>
      </header>
      <section className={styles.stage} aria-label="Memory Burst player">
        <div className={styles.meta}>
          <div><p className={styles.kicker}>A memory you can play</p><h1>{plan.title}</h1></div>
          <span>{frames.length ? visibleIndex + 1 : 0} / {frames.length}</span>
        </div>
        {!loaded ? <div className={styles.empty}>Opening this memory on your device…</div> :
          error ? <p className={styles.empty} role="alert">{error}</p> :
          <div className={styles.frame} data-frame-kind={currentFrame?.kind ?? "EMPTY"}>
            {currentFrame?.kind === "STORY" ?
              <div className={styles.story}>
                <small>{currentFrame.source === "MEMORY_NODE" ? "Your approved memory" : "Your story"}</small>
                <h2>{currentFrame.title}</h2><p>{currentFrame.body}</p>
              </div> :
              currentFrame?.kind === "PHOTO" && currentAsset ?
                <img src={currentAsset.objectUrl} alt={currentFrame.alt} className={styles.visual} /> :
              currentFrame?.kind === "VIDEO" && currentAsset ?
                <video
                  key={currentAsset.id}
                  ref={videoRef}
                  src={currentAsset.objectUrl}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className={styles.visual}
                  onEnded={() => { if (playing) advance(); }}
                /> :
                <div className={styles.empty}>Add a photo or video to Memory Studio to begin.</div>}
          </div>}
        <div className={styles.progress} aria-label="Story progress">
          {frames.map((frame, index) => <button
            key={frame.id}
            type="button"
            aria-label={`Go to frame ${index + 1}`}
            aria-current={index === visibleIndex ? "step" : undefined}
            onClick={() => setFrameIndex(index)}
            className={index === visibleIndex ? styles.active : ""}
          />)}
        </div>
        <nav className={styles.controls} aria-label="Burst playback controls">
          <button type="button" onClick={() => setFrameIndex((index) => Math.max(0, index - 1))} disabled={!loaded || visibleIndex === 0}>← Previous</button>
          <button type="button" className={styles.play} onClick={() => {
            if (!playing && visibleIndex === frames.length - 1) setFrameIndex(0);
            setPlaying((value) => !value);
          }} disabled={!loaded || Boolean(error) || frames.length === 0}>{playing ? "Pause burst" : "Play burst"}</button>
          <button type="button" onClick={advance} disabled={!loaded || visibleIndex >= frames.length - 1}>Next →</button>
        </nav>
        <div className={styles.privacy}>
          <strong>Private preview · no account</strong>
          <span>Photos, videos and story content remain in this browser. This is not a recipient link or a published album.</span>
          {draft.soundtrack.title ? <span>♫ Soundtrack reference: {draft.soundtrack.title} {draft.soundtrack.artist ? `— ${draft.soundtrack.artist}` : ""} (audio is not embedded)</span> : null}
        </div>
      </section>
    </main>
  );
}
