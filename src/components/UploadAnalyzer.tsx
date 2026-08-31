"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { validateChatFileMetadata } from "@/lib/import-validation";
import { resultToChatStats } from "@/lib/result-adapter";
import { makeSampleChat } from "@/lib/sample";
import { createAnalysisTask, type AnalysisTask } from "@/lib/worker-client";
import type { AnalysisStage } from "@/lib/worker-protocol";
import type { DateOrder, StoryMode, ThreadTaleResultV2 } from "@/lib/types";
import { WrappedStory } from "./WrappedStory";

type ProcessingStage = "reading" | AnalysisStage;

const STAGE_COPY: Record<ProcessingStage, string> = {
  reading: "Reading file…",
  validating: "Checking the export…",
  parsing: "Parsing messages…",
  analyzing: "Analyzing your chat…",
  finalizing: "Building your ThreadTale…",
};

export function UploadAnalyzer() {
  const [result, setResult] = useState<ThreadTaleResultV2 | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<ProcessingStage | null>(null);
  const [messageCount, setMessageCount] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dateOrder, setDateOrder] = useState<DateOrder>("auto");
  const [storyMode, setStoryMode] = useState<StoryMode>("friends");
  const fileRef = useRef<HTMLInputElement>(null);
  const activeTaskRef = useRef<AnalysisTask | null>(null);
  const operationRef = useRef(0);
  const demoStartedRef = useRef(false);
  const search = useSearchParams();

  const cancelActiveTask = useCallback(() => {
    activeTaskRef.current?.cancel();
    activeTaskRef.current = null;
  }, []);

  const analyzeContent = useCallback((content: string | ArrayBuffer, operation: number) => {
    cancelActiveTask();
    setBusy(true);
    setError("");
    setResult(null);
    setMessageCount(null);
    setStage("validating");

    const task = createAnalysisTask(content, dateOrder, (progress) => {
      if (operation !== operationRef.current || activeTaskRef.current?.requestId !== task.requestId) return;
      setStage(progress.stage);
      if (progress.messageCount != null) setMessageCount(progress.messageCount);
    });
    activeTaskRef.current = task;

    void task.promise
      .then((nextResult) => {
        if (operation !== operationRef.current || activeTaskRef.current?.requestId !== task.requestId) return;
        setResult(nextResult);
        window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .catch((cause: unknown) => {
        if (operation !== operationRef.current || activeTaskRef.current?.requestId !== task.requestId) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResult(null);
        setError(cause instanceof Error ? cause.message : "Something went wrong while reading that export.");
      })
      .finally(() => {
        if (operation !== operationRef.current || activeTaskRef.current?.requestId !== task.requestId) return;
        activeTaskRef.current = null;
        setBusy(false);
        setStage(null);
      });
  }, [cancelActiveTask, dateOrder]);

  const runDemo = useCallback(() => {
    const operation = ++operationRef.current;
    analyzeContent(makeSampleChat(), operation);
  }, [analyzeContent]);

  useEffect(() => {
    if (search.get("demo") !== "1" || demoStartedRef.current) return;
    demoStartedRef.current = true;
    const timer = window.setTimeout(runDemo, 0);
    return () => window.clearTimeout(timer);
  }, [runDemo, search]);

  useEffect(() => () => {
    operationRef.current += 1;
    cancelActiveTask();
  }, [cancelActiveTask]);

  async function handleFile(file?: File) {
    if (!file) return;

    const operation = ++operationRef.current;
    cancelActiveTask();
    setResult(null);
    setError("");
    setMessageCount(null);
    setStage(null);
    setBusy(false);

    const metadataError = validateChatFileMetadata(file);
    if (metadataError) {
      setError(metadataError);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setBusy(true);
    setStage("reading");
    try {
      const buffer = await file.arrayBuffer();
      if (operation !== operationRef.current) return;
      analyzeContent(buffer, operation);
    } catch {
      if (operation !== operationRef.current) return;
      setResult(null);
      setError("I couldn't read that file. Please export the chat as a text file and try again.");
      setBusy(false);
      setStage(null);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function resetAnalysis() {
    operationRef.current += 1;
    cancelActiveTask();
    setResult(null);
    setError("");
    setBusy(false);
    setStage(null);
    setMessageCount(null);
    setDragging(false);
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.focus();
  }

  const status = stage
    ? stage === "analyzing" && messageCount != null
      ? `Analyzing ${new Intl.NumberFormat().format(messageCount)} messages…`
      : STAGE_COPY[stage]
    : "";

  return <>
    <div className="uploader" aria-busy={busy}>
      <div
        className={`drop ${dragging ? "active" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="drop-icon" aria-hidden="true">💬</div>
        <h2>Drop your chat export here</h2>
        <p>Text-only WhatsApp exports work best. The file is read locally by your browser and analyzed in a browser Web Worker—it is not uploaded to ThreadTales.</p>
        <input
          ref={fileRef}
          className="file-input"
          type="file"
          accept=".txt,text/plain"
          aria-label="Choose WhatsApp text export"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
          {busy ? "Choose another .txt file" : "Choose .txt file"}
        </button>
      </div>
      <div className="controls">
        <label>Story: <select className="select" value={storyMode} onChange={(event) => setStoryMode(event.target.value as StoryMode)} disabled={busy}><option value="friends">Best friends</option><option value="couple">Couple</option><option value="siblings">Siblings</option><option value="family">Family</option><option value="group">Group chat</option></select></label>
        <label>Dates: <select className="select" value={dateOrder} onChange={(event) => setDateOrder(event.target.value as DateOrder)} disabled={busy}><option value="auto">Auto detect</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
        <button className="btn btn-soft" onClick={runDemo} disabled={busy}>Use demo chat</button>
        {busy ? <button className="btn btn-soft" onClick={resetAnalysis}>Cancel analysis</button> : null}
      </div>
      {busy && status ? <div className="story controls" role="status" aria-live="polite">{status}</div> : null}
      {error ? <div className="error" role="alert" aria-live="polite">{error}</div> : null}
    </div>
    {result ? <section id="results" className="results" aria-live="polite">
      <div className="story controls"><span>Your analysis is ready.</span><button className="btn btn-soft" onClick={resetAnalysis}>Analyze another chat</button></div>
      <WrappedStory stats={resultToChatStats(result)} mode={storyMode}/>
    </section> : null}
  </>;
}
