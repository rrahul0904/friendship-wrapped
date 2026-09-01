"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { composeThreadTale } from "@/platform/story/compose";
import { downloadStoryCard, downloadStorySet, shareStoryCard, type StoryCardPreset } from "@/platform/export/story-card";
import { getStoryModeConfig } from "@/platform/story/modes";
import { getStoryTheme, STORY_THEMES, storyThemeBackground } from "@/platform/story/themes";
import type { StoryThemeId } from "@/platform/types";
import { trackProductEvent } from "@/platform/telemetry/client";
import { AIEnrichmentPanel } from "./AIEnrichmentPanel";
import { CinematicStoryPlayer } from "./CinematicStoryPlayer";
import { CloudSavePanel } from "./CloudSavePanel";
import { PremiumPanel } from "./PremiumPanel";

export function StoryChapterDeck({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);
  const config = getStoryModeConfig(mode);
  const [active, setActive] = useState(0);
  const [preset, setPreset] = useState<StoryCardPreset>("vertical");
  const [themeId, setThemeId] = useState<StoryThemeId>(config.theme);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];
  const theme = getStoryTheme(themeId);

  useEffect(() => { trackProductEvent("story_viewed", "threadtales", mode); }, [stats, mode]);

  if (!chapter) return null;

  async function exportCurrent() {
    setExporting(true); setMessage("");
    try { await downloadStoryCard(chapter, preset, true, themeId); trackProductEvent("story_exported", "threadtales", mode); }
    finally { setExporting(false); }
  }

  async function shareCurrent() {
    setExporting(true); setMessage("");
    try {
      const shared = await shareStoryCard(chapter, preset, true, themeId);
      if (!shared) { await downloadStoryCard(chapter, preset, true, themeId); setMessage("Native file sharing is unavailable in this browser, so the PNG was downloaded instead."); }
      else trackProductEvent("share_created", "threadtales", mode);
    } finally { setExporting(false); }
  }

  async function exportSafeStory() {
    setExporting(true); setMessage("");
    try {
      const count = await downloadStorySet(chapters, preset, true, themeId, false);
      trackProductEvent("story_exported", "threadtales", mode);
      setMessage(`Prepared ${count} share-safe story cards. Sensitive name/language chapters were excluded.`);
    } finally { setExporting(false); }
  }

  return <>
    <section className="story chapter-deck" aria-label={`${config.label} story chapters`}>
      <div className="chapter-head">
        <div><span className="story-summary-kicker">Story engine</span><h3>{config.label} · {chapters.length} chapters</h3><p>The same deterministic analysis is composed into an occasion-specific narrative. Sensitive chapters stay local unless you choose to share them.</p></div>
        <div className="chapter-export-controls">
          <label>Theme <select className="select" value={themeId} onChange={(event) => setThemeId(event.target.value as StoryThemeId)}>{Object.values(STORY_THEMES).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label>Export <select className="select" value={preset} onChange={(event) => setPreset(event.target.value as StoryCardPreset)}><option value="vertical">9:16 story</option><option value="portrait">4:5 portrait</option><option value="square">1:1 square</option></select></label>
          <button className="btn btn-primary" onClick={() => void exportCurrent()} disabled={exporting}>{exporting ? "Rendering…" : "Download PNG"}</button>
          <button className="btn btn-soft" onClick={() => void shareCurrent()} disabled={exporting}>Share card</button>
          <button className="btn btn-soft" onClick={() => void exportSafeStory()} disabled={exporting}>Download safe story set</button>
        </div>
      </div>
      <div className="chapter-preview" style={{ background: storyThemeBackground(theme), color: theme.foreground }}>
        <small>{chapter.type.replace("-", " ")}</small><h3>{chapter.title}</h3>{chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}{chapter.subtitle ? <span>{chapter.subtitle}</span> : null}{chapter.supportingText ? <p>{chapter.supportingText}</p> : null}<div className="chapter-privacy">{chapter.privacyLevel === "safe" ? "Share-safe derived fact" : "Sensitive · local unless selected"}</div>
      </div>
      <div className="chapter-nav" aria-label="Story chapter navigation"><button className="btn btn-soft" onClick={() => setActive((value) => Math.max(0, value - 1))} disabled={active === 0}>← Previous</button><div className="chapter-dots">{chapters.map((item, index) => <button key={item.id} className={index === active ? "active" : ""} aria-label={`Open chapter ${index + 1}`} onClick={() => setActive(index)} />)}</div><button className="btn btn-soft" onClick={() => setActive((value) => Math.min(chapters.length - 1, value + 1))} disabled={active === chapters.length - 1}>Next →</button></div>
      {message ? <div className="notice" role="status">{message}</div> : null}
    </section>
    <CinematicStoryPlayer chapters={chapters} themeId={themeId}/>
    <PremiumPanel stats={stats} mode={mode}/>
    <CloudSavePanel stats={stats} mode={mode}/>
    <AIEnrichmentPanel stats={stats} mode={mode}/>
  </>;
}
