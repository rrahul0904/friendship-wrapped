"use client";

import type { StoryCardPreset } from "@/platform/export/story-card";
import { STORY_THEMES, storyThemeBackground } from "@/platform/story/themes";
import type { StoryThemeId } from "@/platform/types";

const THEME_META: Record<StoryThemeId, { mood: string; direction: string }> = {
  midnight: { mood: "Late-night · intimate · glowing", direction: "Constellation glow" },
  sunset: { mood: "Warm · nostalgic · celebratory", direction: "Golden film dissolve" },
  paper: { mood: "Tactile · scrapbook · keepsake", direction: "Printed memory book" },
  neon: { mood: "Group chat · nightlife · chaos", direction: "Kinetic pulse" },
};

const FORMAT_META: Array<{ id: StoryCardPreset; label: string; detail: string }> = [
  { id: "vertical", label: "9:16 Story", detail: "Stories · TikTok" },
  { id: "portrait", label: "4:5 Portrait", detail: "Instagram feed" },
  { id: "square", label: "1:1 Square", detail: "General sharing" },
];

export function ThemeSelector({ value, premiumUnlocked, onChange }: { value: StoryThemeId; premiumUnlocked: boolean; onChange: (value: StoryThemeId) => void }) {
  return <fieldset className="mc-theme-selector">
    <legend>Choose the mood</legend>
    <p>One story system, four art-directed worlds. The selected theme also powers exported cards and cinematic playback.</p>
    <div className="mc-theme-carousel" role="radiogroup" aria-label="Story theme selector">
      {Object.values(STORY_THEMES).map((theme) => {
        const locked = theme.premium && !premiumUnlocked;
        const selected = value === theme.id;
        return <button
          key={theme.id}
          type="button"
          role="radio"
          aria-checked={selected}
          aria-label={`${theme.label}${theme.premium ? " Premium" : " Free"}`}
          className={`mc-theme-card ${selected ? "is-selected" : ""} ${locked ? "is-locked" : ""}`}
          onClick={() => onChange(theme.id)}
        >
          <span className="mc-theme-swatch" style={{ background: storyThemeBackground(theme), color: theme.foreground }}><i style={{ background: theme.accent }} /></span>
          <span className="mc-theme-copy"><span><strong>{theme.label}</strong><em>{theme.premium ? "Premium" : "Free"}</em></span><small>{THEME_META[theme.id].mood}</small><small>{THEME_META[theme.id].direction} · export compatible</small></span>
        </button>;
      })}
    </div>
  </fieldset>;
}

export function ExportToolbar({ preset, exporting, premiumUnlocked, onPresetChange, onDownload, onShare, onExportSet }: { preset: StoryCardPreset; exporting: boolean; premiumUnlocked: boolean; onPresetChange: (value: StoryCardPreset) => void; onDownload: () => void; onShare: () => void; onExportSet: () => void }) {
  return <div className="mc-export-toolbar" aria-label="Story export controls">
    <div className="mc-export-toolbar-head"><div><strong>Share this chapter</strong><small>Derived story artifact · raw chat is never embedded</small></div><span className="mc-local-badge">share-safe</span></div>
    <div className="mc-format-picker" role="group" aria-label="Export format">
      {FORMAT_META.map((format) => <button key={format.id} type="button" className={preset === format.id ? "is-selected" : ""} aria-pressed={preset === format.id} onClick={() => onPresetChange(format.id)}><strong>{format.label}</strong><small>{format.detail}</small></button>)}
    </div>
    <div className="mc-export-actions">
      <button className="btn btn-primary" onClick={onDownload} disabled={exporting}>{exporting ? "Rendering…" : "Download PNG"}</button>
      <button className="btn btn-soft" onClick={onShare} disabled={exporting}>Share card</button>
      <button className="btn btn-soft" onClick={onExportSet} disabled={exporting}>{premiumUnlocked ? "Download full safe story set" : "Premium full story set"}</button>
    </div>
  </div>;
}

export function StoryPrivacyBadge({ sensitive = false }: { sensitive?: boolean }) {
  return <span className={`mc-story-privacy-badge ${sensitive ? "is-sensitive" : "is-safe"}`}>{sensitive ? "Sensitive · local unless selected" : "Share-safe derived fact"}</span>;
}
