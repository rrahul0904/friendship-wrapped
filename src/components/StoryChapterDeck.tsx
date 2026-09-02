"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { validateBrowserPremiumEntitlement } from "@/platform/billing/client-entitlement";
import { downloadStoryCard, downloadStorySet, shareStoryCard, type StoryCardPreset } from "@/platform/export/story-card";
import { composeThreadTale } from "@/platform/story/compose";
import { getStoryModeConfig } from "@/platform/story/modes";
import { getStoryTheme, storyThemeBackground } from "@/platform/story/themes";
import { trackProductEvent } from "@/platform/telemetry/client";
import type { StoryThemeId } from "@/platform/types";
import { AIEnrichmentPanel } from "./AIEnrichmentPanel";
import { CinematicStoryPlayer } from "./CinematicStoryPlayer";
import { CloudSavePanel } from "./CloudSavePanel";
import { ExportToolbar, StoryPrivacyBadge, ThemeSelector } from "./MemoryCinemaControls";
import { PremiumPanel } from "./PremiumPanel";

export function StoryChapterDeck({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);
  const config = getStoryModeConfig(mode);
  const [active, setActive] = useState(0);
  const [preset, setPreset] = useState<StoryCardPreset>("vertical");
  const [themeId, setThemeId] = useState<StoryThemeId>("midnight");
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];
  const theme = getStoryTheme(themeId);

  useEffect(() => { trackProductEvent("story_viewed", "threadtales", mode); }, [stats, mode]);
  useEffect(() => { let cancelled = false; void validateBrowserPremiumEntitlement().then((valid) => { if (!cancelled) { setPremiumUnlocked(valid); if (valid) setThemeId(config.theme); } }); return () => { cancelled = true; }; }, [config.theme]);

  if (!chapter) return null;

  async function exportCurrent() { setExporting(true); setMessage(""); try { await downloadStoryCard(chapter, preset, true, themeId); trackProductEvent("story_exported", "threadtales", mode); setMessage("Your chapter is ready as a social-native PNG."); } finally { setExporting(false); } }
  async function shareCurrent() { setExporting(true); setMessage(""); try { const shared = await shareStoryCard(chapter, preset, true, themeId); if (!shared) { await downloadStoryCard(chapter, preset, true, themeId); setMessage("Native file sharing is unavailable in this browser, so the PNG was downloaded instead."); } else { trackProductEvent("share_created", "threadtales", mode); setMessage("Share sheet opened with this derived story artifact."); } } finally { setExporting(false); } }
  async function exportSafeStory() { if (!premiumUnlocked) { setMessage("Full-story image sets are a Premium artifact. Your complete analysis and individual Midnight cards remain free."); return; } setExporting(true); setMessage(""); try { const count = await downloadStorySet(chapters, preset, true, themeId, false); trackProductEvent("story_exported", "threadtales", mode); setMessage(`Prepared ${count} share-safe story cards. Sensitive name/language chapters were excluded.`); } finally { setExporting(false); } }
  function chooseTheme(next: StoryThemeId) { const requested = getStoryTheme(next); if (requested.premium && !premiumUnlocked) { setMessage(`${requested.label} is a Premium artifact theme. Midnight remains fully available for free.`); return; } setThemeId(next); setMessage(""); }

  return <>
    <section className="story chapter-deck mc-story-deck" aria-label={`${config.label} story chapters`}>
      <div className="chapter-head mc-story-deck-head"><div><span className="story-summary-kicker">Story engine</span><h3>{config.label} · {chapters.length} chapters</h3><p>The complete deterministic analysis remains free. Story themes change the artifact—not the facts—and sensitive chapters stay local unless you explicitly choose otherwise.</p></div></div>
      <div className="mc-story-workbench">
        <div className="mc-story-canvas">
          <div className="chapter-preview" data-preset={preset} style={{ background: storyThemeBackground(theme), color: theme.foreground }}>
            <small>{chapter.type.replace("-", " ")}</small>
            <h3>{chapter.title}</h3>
            {chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}
            {chapter.subtitle ? <span>{chapter.subtitle}</span> : null}
            {chapter.supportingText ? <p>{chapter.supportingText}</p> : null}
            <StoryPrivacyBadge sensitive={chapter.privacyLevel !== "safe"} />
          </div>
          <div className="chapter-nav" aria-label="Story chapter navigation">
            <button className="btn btn-soft" onClick={() => setActive((value) => Math.max(0, value - 1))} disabled={active === 0}>← Previous</button>
            <div className="chapter-dots" aria-label={`Chapter ${active + 1} of ${chapters.length}`}>{chapters.map((item, index) => <button key={item.id} className={index === active ? "active" : ""} aria-label={`Open chapter ${index + 1}`} aria-current={index === active ? "step" : undefined} onClick={() => setActive(index)} />)}</div>
            <button className="btn btn-soft" onClick={() => setActive((value) => Math.min(chapters.length - 1, value + 1))} disabled={active === chapters.length - 1}>Next →</button>
          </div>
        </div>
        <ThemeSelector value={themeId} premiumUnlocked={premiumUnlocked} onChange={chooseTheme} />
      </div>
      <ExportToolbar preset={preset} exporting={exporting} premiumUnlocked={premiumUnlocked} onPresetChange={setPreset} onDownload={() => void exportCurrent()} onShare={() => void shareCurrent()} onExportSet={() => void exportSafeStory()} />
      {message ? <div className="notice mc-export-status" role="status" aria-live="polite">{message}</div> : null}
    </section>
    <CinematicStoryPlayer chapters={chapters} themeId={themeId}/><PremiumPanel stats={stats} mode={mode}/><CloudSavePanel stats={stats} mode={mode}/><AIEnrichmentPanel stats={stats} mode={mode}/>
  </>;
}
