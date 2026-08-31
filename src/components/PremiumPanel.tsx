"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { downloadStoryCard } from "@/platform/export/story-card";
import { composeThreadTale } from "@/platform/story/compose";
import { trackProductEvent } from "@/platform/telemetry/client";
import { KeepsakePanel } from "./KeepsakePanel";

const STORAGE_KEY = "threadtales:premium-entitlement";

export function PremiumPanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const chapters = useMemo(() => composeThreadTale(stats, mode), [stats, mode]);

  useEffect(() => {
    const token = window.localStorage.getItem(STORAGE_KEY);
    if (!token) return;
    let cancelled = false;
    void fetch("/api/entitlements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      .then((response) => response.json())
      .then((data: { valid?: boolean }) => { if (!cancelled) setUnlocked(Boolean(data.valid)); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  async function startCheckout() {
    setBusy(true);
    setMessage("");
    trackProductEvent("checkout_started", "threadtales", mode);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }) });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Checkout is not available yet.");
      window.location.assign(data.url);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Checkout is unavailable.");
      setBusy(false);
    }
  }

  async function cleanExport() {
    const first = chapters[0];
    if (!first) return;
    setBusy(true);
    try {
      await downloadStoryCard(first, "vertical", false);
      trackProductEvent("story_exported", "threadtales", mode);
    } finally {
      setBusy(false);
    }
  }

  return <>
    <section className="story premium-panel">
      <div><span className="story-summary-kicker">ThreadTales Premium</span><h3>{unlocked ? "Premium export unlocked" : "Keep the full story"}</h3><p>{unlocked ? "Your signed purchase entitlement is valid on this browser. Clean exports and print/PDF mode are available." : "The free analysis stays complete. Premium adds branding-free high-resolution exports and the storybook/print experience."}</p></div>
      <div className="premium-actions">{unlocked ? <button className="btn btn-primary" onClick={() => void cleanExport()} disabled={busy}>Download clean 9:16 cover</button> : <button className="btn btn-primary" onClick={() => void startCheckout()} disabled={busy}>{busy ? "Opening secure checkout…" : "Unlock premium"}</button>}</div>
      {message ? <div className="notice" role="status">{message}</div> : null}
    </section>
    {unlocked ? <KeepsakePanel stats={stats} mode={mode}/> : null}
  </>;
}

export const premiumEntitlementStorageKey = STORAGE_KEY;
