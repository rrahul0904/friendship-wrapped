"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { PREMIUM_ENTITLEMENT_STORAGE_KEY, validateBrowserPremiumEntitlement } from "@/platform/billing/client-entitlement";
import { downloadStoryCard, downloadStorySet } from "@/platform/export/story-card";
import { composeThreadTale } from "@/platform/story/compose";
import { getStoryModeConfig } from "@/platform/story/modes";
import { trackProductEvent } from "@/platform/telemetry/client";
import { KeepsakePanel } from "./KeepsakePanel";

export function PremiumPanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);
  const themeId = getStoryModeConfig(mode).theme;

  useEffect(() => { let cancelled = false; void validateBrowserPremiumEntitlement().then((valid) => { if (!cancelled) setUnlocked(valid); }); return () => { cancelled = true; }; }, []);

  async function startCheckout() { setBusy(true); setMessage(""); trackProductEvent("checkout_started", "threadtales", mode); try { const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) }); const data = await response.json() as { url?: string; error?: string }; if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout is not available yet."); window.location.assign(data.url); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Checkout is unavailable."); setBusy(false); } }
  async function cleanCover() { const first = chapters[0]; if (!first) return; setBusy(true); try { await downloadStoryCard(first, "vertical", false, themeId); trackProductEvent("story_exported", "threadtales", mode); } finally { setBusy(false); } }
  async function cleanStorySet() { setBusy(true); setMessage(""); try { const count = await downloadStorySet(chapters, "vertical", false, themeId, includeSensitive); trackProductEvent("story_exported", "threadtales", mode); setMessage(`Prepared ${count} branding-free cards${includeSensitive ? " including the sensitive local chapters you explicitly selected" : " using share-safe chapters only"}.`); } finally { setBusy(false); } }

  return <>
    <section className="story premium-panel"><div><span className="story-summary-kicker">ThreadTales Premium</span><h3>{unlocked ? "Premium artifacts unlocked" : "Keep the full story"}</h3><p>{unlocked ? "Your signed purchase entitlement is valid on this browser. Premium adds the three additional themes, branding-free high-resolution exports, full-story card sets, and the customizable keepsake/PDF flow." : "The analysis, deterministic chapters, standard Midnight theme, share link and individual branded PNG remain free. Premium is for permanence and customization—not basic curiosity."}</p></div>
      <div className="premium-actions">{unlocked ? <><button className="btn btn-primary" onClick={() => void cleanCover()} disabled={busy}>Clean 9:16 cover</button><button className="btn btn-soft" onClick={() => void cleanStorySet()} disabled={busy}>Clean full story set</button></> : <button className="btn btn-primary" onClick={() => void startCheckout()} disabled={busy}>{busy ? "Opening secure checkout…" : "Unlock premium"}</button>}</div>
      {unlocked ? <label className="toggle"><input type="checkbox" checked={includeSensitive} onChange={(event) => setIncludeSensitive(event.target.checked)}/> Include sensitive local chapters such as participant names/top words in the full-story download</label> : null}
      {message ? <div className="notice" role="status">{message}</div> : null}
    </section>{unlocked ? <KeepsakePanel stats={stats} mode={mode}/> : null}
  </>;
}

export const premiumEntitlementStorageKey = PREMIUM_ENTITLEMENT_STORAGE_KEY;
