"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseChat } from "@/lib/parser";
import { analyzeChat } from "@/lib/analyze";
import {
  MIN_CHAT_MESSAGES,
  tooFewMessagesError,
  validateChatFileMetadata,
  validateRawChatText,
} from "@/lib/import-validation";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats, DateOrder, StoryMode } from "@/lib/types";
import { WrappedStory } from "./WrappedStory";

export function UploadAnalyzer() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dateOrder, setDateOrder] = useState<DateOrder>("auto");
  const [storyMode, setStoryMode] = useState<StoryMode>("friends");
  const fileRef = useRef<HTMLInputElement>(null);
  const search = useSearchParams();

  const analyzeText = useCallback(async (text: string) => {
    setBusy(true);
    setError("");
    setStats(null);

    // Yield once so the busy state can paint before synchronous parsing begins.
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));

    try {
      const parsed = parseChat(text, dateOrder);
      if (parsed.length < MIN_CHAT_MESSAGES) throw new Error(tooFewMessagesError(parsed.length));
      setStats(analyzeChat(parsed));
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (cause) {
      setStats(null);
      setError(cause instanceof Error ? cause.message : "Something went wrong while reading that export.");
    } finally {
      setBusy(false);
    }
  }, [dateOrder]);

  useEffect(() => {
    if (search.get("demo") !== "1" || stats || busy) return;
    const timer = window.setTimeout(() => void analyzeText(makeSampleChat()), 0);
    return () => window.clearTimeout(timer);
  }, [analyzeText, busy, search, stats]);

  async function handleFile(file?: File) {
    if (!file || busy) return;

    setStats(null);
    setError("");

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
        setBusy(false);
        return;
      }
      await analyzeText(text);
    } catch {
      setStats(null);
      setError("I couldn't read that file. Please export the chat as a text file and try again.");
      setBusy(false);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function resetAnalysis() {
    setStats(null);
    setError("");
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
        <p>Text-only WhatsApp exports work best. The file is read locally by your browser—it is not uploaded to ThreadTales.</p>
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
          {busy ? "Reading your story…" : "Choose .txt file"}
        </button>
      </div>
      <div className="controls">
        <label>Story: <select className="select" value={storyMode} onChange={(event) => setStoryMode(event.target.value as StoryMode)} disabled={busy}><option value="friends">Best friends</option><option value="couple">Couple</option><option value="siblings">Siblings</option><option value="family">Family</option><option value="group">Group chat</option></select></label>
        <label>Dates: <select className="select" value={dateOrder} onChange={(event) => setDateOrder(event.target.value as DateOrder)} disabled={busy}><option value="auto">Auto / US-first</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
        <button className="btn btn-soft" onClick={() => void analyzeText(makeSampleChat())} disabled={busy}>Use demo chat</button>
      </div>
      {error ? <div className="error" role="alert" aria-live="polite">{error}</div> : null}
    </div>
    {stats ? <section id="results" className="results" aria-live="polite">
      <div className="story controls"><span>Your analysis is ready.</span><button className="btn btn-soft" onClick={resetAnalysis}>Analyze another chat</button></div>
      <WrappedStory stats={stats} mode={storyMode}/>
    </section> : null}
  </>;
}
