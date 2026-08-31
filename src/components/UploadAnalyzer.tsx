"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseChat } from "@/lib/parser";
import { analyzeChat } from "@/lib/analyze";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats, DateOrder, StoryMode } from "@/lib/types";
import { WrappedStory } from "./WrappedStory";

const MAX_BYTES = 15 * 1024 * 1024;
const CHECKOUT_ANALYSIS_KEY = "threadtales:checkout-analysis";
const CHECKOUT_ANALYSIS_MAX_AGE = 4 * 60 * 60 * 1000;

interface StoredAnalysis {
  v: 1;
  stats: ChatStats;
  mode: StoryMode;
  savedAt: number;
}

function restoreCheckoutAnalysis(): StoredAnalysis | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_ANALYSIS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as StoredAnalysis;
    if (value.v !== 1 || !value.stats?.totalMessages || !value.mode || !value.savedAt) return null;
    if (Date.now() - value.savedAt > CHECKOUT_ANALYSIS_MAX_AGE) {
      sessionStorage.removeItem(CHECKOUT_ANALYSIS_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function UploadAnalyzer() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dateOrder, setDateOrder] = useState<DateOrder>("auto");
  const [storyMode, setStoryMode] = useState<StoryMode>("friends");
  const [restoredPurchaseFlow, setRestoredPurchaseFlow] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const search = useSearchParams();

  function analyzeText(text: string) {
    setBusy(true); setError("");
    window.setTimeout(() => {
      try {
        const parsed = parseChat(text, dateOrder);
        if (parsed.length < 5) throw new Error("I couldn't find enough WhatsApp-style messages. Export the chat as a .txt file without media and try again.");
        setStats(analyzeChat(parsed));
        window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong while reading that export."); }
      finally { setBusy(false); }
    }, 30);
  }

  useEffect(() => {
    const checkoutState = search.get("checkout");
    if (!checkoutState || stats) return;
    const stored = restoreCheckoutAnalysis();
    if (stored) {
      setStats(stored.stats);
      setStoryMode(stored.mode);
      setRestoredPurchaseFlow(true);
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } else if (checkoutState === "success") {
      setError("Your purchase can still be verified, but this tab no longer has the derived story state. Re-upload the same chat export to render the unlocked story; the raw chat is never stored by ThreadTales.");
    }
  }, [search, stats]);

  useEffect(() => {
    if (stats) return;
    if (search.get("checkout")) return;
    if (search.get("demo") === "1" && !busy) analyzeText(makeSampleChat());
    // Intentionally only run when demo query appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!stats) return;
    const stored: StoredAnalysis = { v: 1, stats, mode: storyMode, savedAt: Date.now() };
    sessionStorage.setItem(CHECKOUT_ANALYSIS_KEY, JSON.stringify(stored));
  }, [stats, storyMode]);

  async function useFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_BYTES) { setError("That file is over 15 MB. For V1, please export a smaller text-only chat."); return; }
    if (!file.name.toLowerCase().endsWith(".txt")) { setError("Please use the .txt file from a chat export."); return; }
    analyzeText(await file.text());
  }

  return <>
    <div className="uploader">
      <div className={`drop ${dragging ? "active" : ""}`} onDragOver={(e)=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={(e)=>{e.preventDefault();setDragging(false);void useFile(e.dataTransfer.files[0])}}>
        <div className="drop-icon">💬</div><h2>Drop your chat export here</h2><p>Text-only WhatsApp exports work best. The file is read locally by your browser—it is not uploaded to ThreadTales.</p>
        <input ref={fileRef} className="file-input" type="file" accept=".txt,text/plain" onChange={(e)=>void useFile(e.target.files?.[0])}/>
        <button className="btn btn-primary" onClick={()=>fileRef.current?.click()} disabled={busy}>{busy ? "Reading your story…" : "Choose .txt file"}</button>
      </div>
      <div className="controls">
        <label>Story: <select className="select" value={storyMode} onChange={(e)=>setStoryMode(e.target.value as StoryMode)}><option value="friends">Best friends</option><option value="couple">Couple</option><option value="siblings">Siblings</option><option value="family">Family</option><option value="group">Group chat</option></select></label>
        <label>Dates: <select className="select" value={dateOrder} onChange={(e)=>setDateOrder(e.target.value as DateOrder)}><option value="auto">Auto / US-first</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label>
        <button className="btn btn-soft" onClick={()=>analyzeText(makeSampleChat())} disabled={busy}>Use demo chat</button>
      </div>
      {restoredPurchaseFlow ? <div className="restore-note">✓ Your derived story was restored locally after checkout. Raw messages were never saved.</div> : null}
      {error ? <div className="error">{error}</div> : null}
    </div>
    {stats ? <section id="results" className="results"><WrappedStory stats={stats} mode={storyMode}/></section> : null}
  </>;
}
