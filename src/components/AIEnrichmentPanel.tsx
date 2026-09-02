"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { STORY_ENRICHMENT_INTENTS, type StoryEnrichmentIntent } from "@/platform/ai/types";
import { composeThreadTale } from "@/platform/story/compose";
import { trackProductEvent } from "@/platform/telemetry/client";

const ACTIONS: Array<{ intent: StoryEnrichmentIntent; label: string }> = [
  { intent: "sweeter", label: "Make this caption sweeter" },
  { intent: "funnier", label: "Make this chapter funnier" },
  { intent: "birthday-caption", label: "Write a birthday caption" },
  { intent: "anniversary-caption", label: "Write an anniversary caption" },
  { intent: "shorter-share-caption", label: "Make this share caption shorter" },
];

export function AIEnrichmentPanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [intent, setIntent] = useState<StoryEnrichmentIntent>("recap");
  const [snippet, setSnippet] = useState("");
  const [consent, setConsent] = useState(false);
  const [output, setOutput] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const safeChapters = useMemo(() => composeThreadTale(stats, mode).filter((chapter) => chapter.privacyLevel === "safe").map(({ id, type, title, subtitle, metric, supportingText, renderVariant }) => ({ id, type, title, subtitle, metric, supportingText, renderVariant })), [stats, mode]);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/ai/enrich", { cache: "no-store" }).then((response) => response.json()).then((data: { enabled?: boolean }) => { if (!cancelled) setEnabled(Boolean(data.enabled)); }).catch(() => { if (!cancelled) setEnabled(false); });
    return () => { cancelled = true; };
  }, []);

  async function enrich(nextIntent = intent) {
    if (!STORY_ENRICHMENT_INTENTS.includes(nextIntent)) return;
    setIntent(nextIntent); setBusy(true); setMessage("");
    trackProductEvent("ai_enrichment_started", "threadtales", mode);
    try {
      const input = {
        product: "threadtales" as const,
        mode,
        intent: nextIntent,
        facts: {
          totalMessages: stats.totalMessages, totalWords: stats.totalWords, daysTogether: stats.daysTogether, activeDays: stats.activeDays,
          longestStreak: stats.longestStreak, longestSilenceDays: stats.longestSilenceDays, medianReplyMinutes: stats.medianReplyMinutes,
          peakHour: stats.peakHour, favoriteWeekday: stats.favoriteWeekday, lateNightMessages: stats.lateNightMessages,
          questionsAsked: stats.questionsAsked, laughSignals: stats.laughSignals, heartSignals: stats.heartSignals, mediaSignals: stats.mediaSignals,
          conversationBalance: stats.conversationBalance, yearCount: stats.byYear.length,
        },
        chapters: safeChapters,
        ...(snippet.trim() ? { selectedSnippet: snippet.trim(), snippetConsent: consent } : {}),
      };
      const response = await fetch("/api/ai/enrich", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await response.json() as { text?: string; error?: string; model?: string };
      if (!response.ok || !data.text) throw new Error(data.error ?? "AI enrichment failed.");
      setOutput(data.text); trackProductEvent("ai_enrichment_completed", "threadtales", mode);
      setMessage(`Optional AI copy generated${data.model ? ` with ${data.model}` : ""}. Edit it freely before using it.`);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "AI enrichment failed."); }
    finally { setBusy(false); }
  }

  if (enabled === null) return <section className="story ai-panel"><p>Checking optional AI enrichment…</p></section>;
  if (!enabled) return <section className="story ai-panel mc-ai-panel"><span className="story-summary-kicker">Optional AI</span><h3>Deterministic story mode is active.</h3><p>AI enrichment is not configured. The analysis, story, sharing and exports continue without it.</p><div className="mc-ai-safety">AI only uses the share-safe summary unless you explicitly allow a selected snippet.</div></section>;

  return <section className="story ai-panel mc-ai-panel">
    <span className="story-summary-kicker">Optional AI studio</span><h3>Polish the words, not the facts.</h3>
    <p>These actions send only allowlisted aggregate metrics and share-safe deterministic chapters by default. Participant names, top words and raw messages stay out.</p>
    <div className="mc-ai-actions" aria-label="AI writing actions">{ACTIONS.map((action) => <button className={`btn btn-soft ${intent === action.intent ? "active" : ""}`} key={action.intent} disabled={busy || Boolean(snippet.trim() && !consent)} onClick={() => void enrich(action.intent)}>{action.label}</button>)}</div>
    <label className="file-drop">Optional user-selected snippet<textarea className="share-input story-textarea" value={snippet} maxLength={600} onChange={(event) => { setSnippet(event.target.value); if (!event.target.value.trim()) setConsent(false); }} placeholder="Paste up to 600 characters only if you want this exact snippet processed remotely."/></label>
    {snippet.trim() ? <label className="toggle"><input type="checkbox" checked={consent} onChange={(event)=>setConsent(event.target.checked)}/> I understand this selected snippet will be sent to the configured AI provider.</label> : null}
    <div className="mc-ai-safety">AI only uses the share-safe summary unless you explicitly allow more context.</div>
    <button className="btn btn-primary" disabled={busy || Boolean(snippet.trim() && !consent)} onClick={() => void enrich("recap")}>{busy ? "Writing…" : "Generate full recap copy"}</button>
    {output ? <label className="file-drop">Editable AI output<textarea className="share-input story-textarea ai-output" value={output} onChange={(event)=>setOutput(event.target.value)}/></label> : null}
    {message ? <div className="notice" role="status">{message}</div> : null}
  </section>;
}
