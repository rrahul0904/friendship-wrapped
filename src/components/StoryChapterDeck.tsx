"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { validateBrowserPremiumEntitlement } from "@/platform/billing/client-entitlement";
import { downloadStoryCard, downloadStorySet, shareStoryCard, type StoryCardPreset } from "@/platform/export/story-card";
import { composeThreadTale } from "@/platform/story/compose";
import { getStoryModeConfig } from "@/platform/story/modes";
import { getStoryTheme, storyThemeBackground } from "@/platform/story/themes";
import { trackProductEvent } from "@/platform/telemetry/client";
import type { StoryThemeId } from "@/platform/types";
import { AIEnrichmentPanel } from "./AIEnrichmentPanel";
import { CloudSavePanel } from "./CloudSavePanel";
import { ExportToolbar, StoryPrivacyBadge, ThemeSelector } from "./MemoryCinemaControls";
import { PremiumPanel } from "./PremiumPanel";

const SWIPE_THRESHOLD = 44;

export function StoryChapterDeck({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);
  const config = getStoryModeConfig(mode);
  const [active, setActive] = useState(0);
  const [preset, setPreset] = useState<StoryCardPreset>("vertical");
  const [themeId, setThemeId] = useState<StoryThemeId>("midnight");
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [postStoryOpen, setPostStoryOpen] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];
  const theme = getStoryTheme(themeId);
  const atEnd = active === chapters.length - 1;

  useEffect(() => { trackProductEvent("story_viewed", "threadtales", mode); }, [stats, mode]);
  useEffect(() => {
    let cancelled = false;
    void validateBrowserPremiumEntitlement().then((valid) => {
      if (!cancelled) {
        setPremiumUnlocked(valid);
        if (valid) setThemeId(config.theme);
      }
    });
    return () => { cancelled = true; };
  }, [config.theme]);

  if (!chapter) return null;

  function goTo(index: number) {
    setActive(Math.max(0, Math.min(chapters.length - 1, index)));
    setMessage("");
    setPostStoryOpen(false);
  }
  function goPrevious() { goTo(active - 1); }
  function goNext() { goTo(active + 1); }
  function handleStoryKeys(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, textarea, summary")) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); goNext(); }
    if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); goPrevious(); }
    if (event.key === "Home") { event.preventDefault(); goTo(0); }
    if (event.key === "End") { event.preventDefault(); goTo(chapters.length - 1); }
  }
  function handleTouchStart(clientX: number) { swipeStartX.current = clientX; }
  function handleTouchEnd(clientX: number) {
    const start = swipeStartX.current;
    swipeStartX.current = null;
    if (start === null) return;
    const delta = clientX - start;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrevious();
  }

  async function exportCurrent() {
    setExporting(true);
    setMessage("");
    try {
      await downloadStoryCard(chapter, preset, true, themeId);
      trackProductEvent("story_exported", "threadtales", mode);
      setMessage("Saved as a share-ready PNG.");
    } finally { setExporting(false); }
  }
  async function shareCurrent() {
    setExporting(true);
    setMessage("");
    try {
      const shared = await shareStoryCard(chapter, preset, true, themeId);
      if (!shared) {
        await downloadStoryCard(chapter, preset, true, themeId);
        setMessage("Sharing is unavailable here, so the chapter was saved instead.");
      } else {
        trackProductEvent("share_created", "threadtales", mode);
        setMessage("Share sheet opened.");
      }
    } finally { setExporting(false); }
  }
  async function exportSafeStory() {
    if (!premiumUnlocked) {
      setMessage("Full-story image sets are a Premium artifact. Individual Midnight chapters remain free.");
      return;
    }
    setExporting(true);
    setMessage("");
    try {
      const count = await downloadStorySet(chapters, preset, true, themeId, false);
      trackProductEvent("story_exported", "threadtales", mode);
      setMessage(`Prepared ${count} share-safe story cards.`);
    } finally { setExporting(false); }
  }
  function chooseTheme(next: StoryThemeId) {
    const requested = getStoryTheme(next);
    if (requested.premium && !premiumUnlocked) {
      setMessage(`${requested.label} is a Premium artifact theme. Midnight remains fully available for free.`);
      return;
    }
    setThemeId(next);
    setMessage("");
  }

  return <>
    <section className="story chapter-deck mc-story-deck mc-story-first-deck" aria-label={`${config.label} story chapters`}>
      <div className="mc-story-topline">
        <span>{config.label}</span>
        <span aria-live="polite">{active + 1} / {chapters.length}</span>
      </div>
      <div className="mc-story-progress" aria-label={`Chapter ${active + 1} of ${chapters.length}`}>
        {chapters.map((item, index) => <button key={item.id} type="button" className={index === active ? "active" : index < active ? "complete" : ""} aria-label={`Open chapter ${index + 1}`} aria-current={index === active ? "step" : undefined} onClick={() => goTo(index)}><span/></button>)}
      </div>

      <div className="mc-story-workbench">
        <div
          className="mc-story-canvas"
          tabIndex={0}
          onKeyDown={handleStoryKeys}
          onTouchStart={(event) => handleTouchStart(event.touches[0]?.clientX ?? 0)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
          aria-label="Story chapter viewer"
          data-active-chapter={active + 1}
        >
          <article key={chapter.id} className={`chapter-preview mc-story-scene mc-story-scene-${chapter.renderVariant}`} data-preset="vertical" data-story-aspect="9:16" style={{ background: storyThemeBackground(theme), color: theme.foreground }}>
            <div className="mc-story-scene-content">
              <small>{chapter.type.replace("-", " ")}</small>
              <h3>{chapter.title}</h3>
              {chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}
              {chapter.subtitle ? <span>{chapter.subtitle}</span> : null}
              {chapter.supportingText ? <p>{chapter.supportingText}</p> : null}
            </div>
            <StoryPrivacyBadge sensitive={chapter.privacyLevel !== "safe"} />
          </article>
          <button className="mc-story-tap mc-story-tap-prev" type="button" aria-label="Previous chapter" onClick={goPrevious} disabled={active === 0}><span aria-hidden="true">‹</span></button>
          <button className="mc-story-tap mc-story-tap-next" type="button" aria-label="Next chapter" onClick={goNext} disabled={atEnd}><span aria-hidden="true">›</span></button>
        </div>
      </div>

      <div className="mc-story-primary-actions" aria-label="Chapter actions">
        <button className="mc-story-action" aria-label="Download PNG" type="button" onClick={() => void exportCurrent()} disabled={exporting}>↓ Save chapter</button>
        <button className="mc-story-action mc-story-action-primary" aria-label="Share card" type="button" onClick={() => void shareCurrent()} disabled={exporting}>↗ Share</button>
      </div>
      <p className="mc-story-gesture-hint">Tap the sides, swipe, or use arrow keys</p>
      {message ? <div className="notice mc-export-status" role="status" aria-live="polite">{message}</div> : null}

      {atEnd ? <div className="mc-story-finale">
        <p className="mc-story-finale-kicker">Your keepsake is ready</p>
        <h2>Keep the part you want to remember.</h2>
        <p>Save this closing card, revisit any chapter, or open the optional styling and account tools only if you want them.</p>
        <div className="mc-story-finale-actions">
          <button className="btn btn-primary" type="button" onClick={() => void exportCurrent()} disabled={exporting}>Save closing card</button>
          <button className="btn btn-soft" type="button" onClick={() => goTo(0)}>Replay story</button>
        </div>
        <details className="mc-story-customize mc-story-finish-options">
          <summary>Style and export options</summary>
          <ThemeSelector value={themeId} premiumUnlocked={premiumUnlocked} onChange={chooseTheme}/>
          <ExportToolbar preset={preset} exporting={exporting} premiumUnlocked={premiumUnlocked} onPresetChange={setPreset} onDownload={() => void exportCurrent()} onShare={() => void shareCurrent()} onExportSet={() => void exportSafeStory()} />
        </details>
        <button className="mc-story-more" type="button" aria-expanded={postStoryOpen} onClick={() => setPostStoryOpen((value) => !value)}>{postStoryOpen ? "Hide optional tools" : "Account, cloud and AI options"}</button>
      </div> : null}
    </section>
    {atEnd && postStoryOpen ? <section className="mc-post-story-tools" aria-label="Optional post-story tools"><PremiumPanel stats={stats} mode={mode}/><CloudSavePanel stats={stats} mode={mode}/><AIEnrichmentPanel stats={stats} mode={mode}/></section> : null}
  </>;
}
