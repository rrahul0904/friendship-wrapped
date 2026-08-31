"use client";

import { useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { composeThreadTale } from "@/platform/story/compose";
import { downloadStoryCard, type StoryCardPreset } from "@/platform/export/story-card";
import { getStoryModeConfig } from "@/platform/story/modes";
import { PremiumPanel } from "./PremiumPanel";

export function StoryChapterDeck({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);
  const [active, setActive] = useState(0);
  const [preset, setPreset] = useState<StoryCardPreset>("vertical");
  const [exporting, setExporting] = useState(false);
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];
  const config = getStoryModeConfig(mode);

  if (!chapter) return null;

  async function exportCurrent() {
    setExporting(true);
    try {
      await downloadStoryCard(chapter, preset, true);
    } finally {
      setExporting(false);
    }
  }

  return <>
    <section className="story chapter-deck" aria-label={`${config.label} story chapters`}>
      <div className="chapter-head">
        <div><span className="story-summary-kicker">Story engine</span><h3>{config.label} · {chapters.length} chapters</h3><p>The same deterministic analysis is composed into an occasion-specific narrative. Sensitive chapters stay local unless you choose to share them.</p></div>
        <div className="chapter-export-controls">
          <label>Export <select className="select" value={preset} onChange={(event) => setPreset(event.target.value as StoryCardPreset)}><option value="vertical">9:16 story</option><option value="square">1:1 square</option></select></label>
          <button className="btn btn-primary" onClick={() => void exportCurrent()} disabled={exporting}>{exporting ? "Rendering…" : "Download PNG"}</button>
        </div>
      </div>
      <div className={`chapter-preview theme-${config.theme}`}>
        <small>{chapter.type.replace("-", " ")}</small>
        <h3>{chapter.title}</h3>
        {chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}
        {chapter.subtitle ? <span>{chapter.subtitle}</span> : null}
        {chapter.supportingText ? <p>{chapter.supportingText}</p> : null}
        <div className="chapter-privacy">{chapter.privacyLevel === "safe" ? "Share-safe derived fact" : "Sensitive · local unless selected"}</div>
      </div>
      <div className="chapter-nav" aria-label="Story chapter navigation">
        <button className="btn btn-soft" onClick={() => setActive((value) => Math.max(0, value - 1))} disabled={active === 0}>← Previous</button>
        <div className="chapter-dots">{chapters.map((item, index) => <button key={item.id} className={index === active ? "active" : ""} aria-label={`Open chapter ${index + 1}`} onClick={() => setActive(index)} />)}</div>
        <button className="btn btn-soft" onClick={() => setActive((value) => Math.min(chapters.length - 1, value + 1))} disabled={active === chapters.length - 1}>Next →</button>
      </div>
    </section>
    <PremiumPanel stats={stats} mode={mode}/>
  </>;
}
