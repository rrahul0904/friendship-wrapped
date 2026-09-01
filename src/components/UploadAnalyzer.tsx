"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MIN_CHAT_MESSAGES, tooFewMessagesError, validateChatFileMetadata, validateRawChatText } from "@/lib/import-validation";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats, DateOrder, StoryMode } from "@/lib/types";
import { isStoryMode, STORY_MODES } from "@/platform/story/modes";
import { trackProductEvent } from "@/platform/telemetry/client";
import { analyzeThreadTaleInput } from "@/platform/threadtales/worker-client";
import { buildThreadTalesLocalLore, type ThreadTalesLocalLore } from "@/platform/threadtales/lore";
import { LocalLorePanel } from "./LocalLorePanel";
import { WrappedStory } from "./WrappedStory";

export function UploadAnalyzer() {
  const [stats, setStats] = useState<ChatStats | null>(null); const [lore, setLore] = useState<ThreadTalesLocalLore | null>(null); const [error, setError] = useState(""); const [warning, setWarning] = useState(""); const [busy, setBusy] = useState(false); const [dragging, setDragging] = useState(false); const [dateOrder, setDateOrder] = useState<DateOrder>("auto"); const [storyMode, setStoryMode] = useState<StoryMode>("friends");
  const fileRef = useRef<HTMLInputElement>(null); const abortRef = useRef<AbortController | null>(null); const requestRef = useRef(0); const search = useSearchParams();

  useEffect(() => () => abortRef.current?.abort(), []);

  const analyzeText = useCallback(async (text: string, name = "threadtales-demo.txt", type = "text/plain") => {
    abortRef.current?.abort();
    const controller = new AbortController(); abortRef.current = controller; const requestId = ++requestRef.current;
    setBusy(true); setError(""); setWarning(""); setStats(null); setLore(null); trackProductEvent("analysis_started", "threadtales");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    try {
      const parsed = await analyzeThreadTaleInput({ name, type, size: new Blob([text]).size, text }, dateOrder, controller.signal);
      if (requestId !== requestRef.current || controller.signal.aborted) return;
      if (parsed.messages.length < MIN_CHAT_MESSAGES) throw new Error(tooFewMessagesError(parsed.messages.length));
      setStats(parsed.stats); setLore(buildThreadTalesLocalLore(parsed.messages)); setWarning(parsed.warnings[0] ?? ""); trackProductEvent("analysis_completed", "threadtales"); window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (cause) {
      if (requestId !== requestRef.current) return;
      setStats(null); setLore(null); setError(cause instanceof Error && cause.name === "AbortError" ? "Analysis cancelled. You can choose another export whenever you're ready." : cause instanceof Error ? cause.message : "Something went wrong while reading that export.");
    } finally { if (requestId === requestRef.current) { setBusy(false); abortRef.current = null; } }
  }, [dateOrder]);

  useEffect(() => { const requestedMode = search.get("mode"); if (!isStoryMode(requestedMode)) return; const timer = window.setTimeout(() => setStoryMode(requestedMode), 0); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { if (search.get("demo") !== "1" || stats || busy) return; const timer = window.setTimeout(() => void analyzeText(makeSampleChat()), 0); return () => window.clearTimeout(timer); }, [analyzeText, busy, search, stats]);

  async function handleFile(file?: File) { if (!file || busy) return; setStats(null); setLore(null); setError(""); setWarning(""); const metadataError = validateChatFileMetadata(file); if (metadataError) { setError(metadataError); if (fileRef.current) fileRef.current.value = ""; return; } setBusy(true); try { const text = await file.text(); const textError = validateRawChatText(text); if (textError) { setError(textError); return; } await analyzeText(text, file.name, file.type || (file.name.toLowerCase().endsWith(".json") ? "application/json" : "text/plain")); } catch { setStats(null); setLore(null); setError("I couldn't read that file. Please export a supported single chat and try again."); } finally { if (fileRef.current) fileRef.current.value = ""; } }
  function cancelAnalysis() { requestRef.current += 1; abortRef.current?.abort(); abortRef.current = null; setBusy(false); setStats(null); setLore(null); setWarning(""); setError("Analysis cancelled. You can choose another export whenever you're ready."); }
  function resetAnalysis() { requestRef.current += 1; abortRef.current?.abort(); abortRef.current = null; setStats(null); setLore(null); setError(""); setWarning(""); setDragging(false); setBusy(false); if (fileRef.current) fileRef.current.value = ""; fileRef.current?.focus(); }

  return <><div className="uploader" aria-busy={busy}><div className={`drop ${dragging ? "active" : ""}`} onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void handleFile(event.dataTransfer.files[0]); }}><div className="drop-icon" aria-hidden="true">💬</div><h2>Drop your chat export here</h2><p>WhatsApp .txt and single-chat Telegram .json exports are processed locally. Parsing and analytics run in a browser Web Worker when available—the raw file is not uploaded to ThreadTales.</p><input ref={fileRef} className="file-input" type="file" accept=".txt,.json,text/plain,application/json" aria-label="Choose WhatsApp text export or Telegram JSON export" onChange={(event) => void handleFile(event.target.files?.[0])} disabled={busy}/><button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? "Analyzing in the background…" : "Choose chat export"}</button></div>
    <div className="controls"><label>Story: <select className="select" value={storyMode} onChange={(event) => setStoryMode(event.target.value as StoryMode)} disabled={busy}>{Object.values(STORY_MODES).map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label><label>WhatsApp dates: <select className="select" value={dateOrder} onChange={(event) => setDateOrder(event.target.value as DateOrder)} disabled={busy}><option value="auto">Auto / US-first</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label><button className="btn btn-soft" onClick={() => void analyzeText(makeSampleChat())} disabled={busy}>Use demo chat</button>{busy ? <button className="btn btn-soft" onClick={cancelAnalysis}>Cancel analysis</button> : null}</div>{warning ? <div className="notice" role="status">{warning}</div> : null}{error ? <div className="error" role="alert" aria-live="polite">{error}</div> : null}</div>
    {stats ? <section id="results" className="results" aria-live="polite"><div className="story controls"><span>Your analysis is ready.</span><button className="btn btn-soft" onClick={resetAnalysis}>Analyze another chat</button></div><WrappedStory stats={stats} mode={storyMode}/>{lore ? <LocalLorePanel lore={lore}/> : null}</section> : null}</>;
}
