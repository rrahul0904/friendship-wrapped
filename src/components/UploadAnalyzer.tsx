"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { parseChat } from "@/lib/parser";
import { analyzeChat } from "@/lib/analyze";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats, DateOrder } from "@/lib/types";
import { WrappedStory } from "./WrappedStory";

const MAX_BYTES = 15 * 1024 * 1024;

export function UploadAnalyzer() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [dateOrder, setDateOrder] = useState<DateOrder>("auto");
  const fileRef = useRef<HTMLInputElement>(null);
  const search = useSearchParams();

  function analyzeText(text: string) {
    setBusy(true); setError("");
    window.setTimeout(() => {
      try {
        const parsed = parseChat(text, dateOrder);
        if (parsed.length < 5) throw new Error("I couldn't find enough WhatsApp-style messages. Export the chat as a .txt file without media and try again.");
        setStats(analyzeChat(parsed));
        window.setTimeout(() => document.getElementById("results")?.scrollIntoView({behavior:"smooth"}), 50);
      } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong while reading that export."); }
      finally { setBusy(false); }
    }, 30);
  }

  useEffect(() => {
    if (search.get("demo") === "1" && !stats && !busy) analyzeText(makeSampleChat());
    // Intentionally only run when demo query appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
      <div className="controls"><label>Dates: <select className="select" value={dateOrder} onChange={(e)=>setDateOrder(e.target.value as DateOrder)}><option value="auto">Auto / US-first</option><option value="mdy">MM/DD/YYYY</option><option value="dmy">DD/MM/YYYY</option></select></label><button className="btn btn-soft" onClick={()=>analyzeText(makeSampleChat())} disabled={busy}>Use demo chat</button></div>
      {error ? <div className="error">{error}</div> : null}
    </div>
    {stats ? <section id="results" className="results"><WrappedStory stats={stats}/></section> : null}
  </>;
}
