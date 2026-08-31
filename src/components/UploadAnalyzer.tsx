"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MIN_CHAT_MESSAGES,
  tooFewMessagesError,
  validateChatFileMetadata,
  validateRawChatText,
} from "@/lib/import-validation";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats, DateOrder, StoryMode } from "@/lib/types";
import { isStoryMode, STORY_MODES } from "@/platform/story/modes";
import { trackProductEvent } from "@/platform/telemetry/client";
import { analyzeThreadTaleInput } from "@/platform/threadtales/worker-client";
import { WrappedStory } from "./WrappedStory";

export function UploadAnalyzer() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dateOrder, setDateOrder] = useState<DateOrder>("auto");
  const [storyMode, setStoryMode] = useState<StoryMode>("friends");
  const fileRef = useRef<HTMLInputElement>(null);
  const search = useSearchParams();

  const analyzeText = useCallback(async (text: string, name = "threadtales-demo.txt") => {
    setBusy(true);
    setError("");
    setWarning("");
    setStats(null);
    trackProductEvent("analysis_started", "threadtales");

    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    try {
      const parsed = await analyzeThreadTaleInput({ name, type: "text/plain", size: new Blob([text]).size, text }, dateOrder);
      if (parsed.messages.length < MIN_CHAT_MESSAGES) throw new Error(tooFewMessagesError(parsed.messages.length));
      setStats(parsed.stats);
      setWarning(parsed.warnings[0] ?? "");
      trackProductEvent("analysis_completed", "threadtales");
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (cause) {
      setStats(null);
      setError(cause instanceof Error ? cause.message : "Something went wrong while reading that export.");
    } finally {
      setBusy(false);
    }
  }, [dateOrder]);

  useEffect(() => {
    const requestedMode = search.get("mode");
    if (!isStoryMode(requestedMode)) return;
    const timer = window.setTimeout(() => setStoryMode(requestedMode), 0);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (search.get("demo") !== "1" || stats || busy) return;
    const timer = window.setTimeout(() => void analyzeText(makeSampleChat()), 0);
    return () => window.clearTimeout(timer);
  }, [analyzeText, busy, search, stats]);

  async function handleFile(file?: File) {
    if (!file || busy) return;

    setStats(null);
    setError("");
    setWarning("");

    const metadataError = validateChatFileMetadata(file);
    if (metadataError) {
      setError(metadataError);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      const text = await file.text();
      const textError = validateRawChatText(text);
      if (textError) {
        setError(textError);
        return;
      }
      await analyzeText(text, file.name);
    } catch {
      setStats(null);
      setError("I couldn't read that file. Please export the chat as a text file and try again.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function resetAnalysis() {
    setStats(null);
    setError("");
    setWarning("");
    setDragging(false);
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.focus();
  }

  return <>
    <div className="uploader" aria-busy={busy}>
      <div
        className={`drop ${dragging ? "active" : ""}`}
        onDragOver={(event) => { event.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="drop-icon" aria-hidden="true">💬</div>
        <h2>Drop your chat export here</h2>
        <p>Text-only WhatsApp exports work best. Parsing and analytics run in a browser Web Worker when available—the raw file is not uploaded to ThreadTales.</p>
        <input
          ref={fileRef}
          className="file-input"
          type="file"
          accept=".txt,text/plain"
          aria-label="Choose WhatsApp text export"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          disabled={busy}
        />
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? "Analyzing in the background…" : "Choose .txt file"}
        </button>
      </div>
      <div className="controls">
        <label>Story: <select className="select" value={storyMode} onChange={(event) => setStoryMode(event.target.value as StoryMode)} disabled={busy}>{Object.values(STORY_MODES).map((mode) => <option key={mode.id} value={mode.id}>{mode.label}</option>)}</select></label>
        <label>Dates: <select className="select" value={dateOrder} onChange={(event) => setDateOrder(event.target.value as DateOrder)} disabled={busy}><option value="auto">Auto / US-first</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
        <button className="btn btn-soft" onClick={() => void analyzeText(makeSampleChat())} disabled={busy}>Use demo chat</button>
      </div>
      {warning ? <div className="notice" role="status">{warning}</div> : null}
      {error ? <div className="error" role="alert" aria-live="polite">{error}</div> : null}
    </div>
    {stats ? <section id="results" className="results" aria-live="polite">
      <div className="story controls"><span>Your analysis is ready.</span><button className="btn btn-soft" onClick={resetAnalysis}>Analyze another chat</button></div>
      <WrappedStory stats={stats} mode={storyMode}/>
    </section> : null}
  </>;
}
