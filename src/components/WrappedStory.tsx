"use client";

import { useMemo, useState } from "react";
import type { ChatStats, PublicSnapshot } from "@/lib/types";
import { createSnapshot, encodeSnapshot } from "@/lib/share";

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour % 12 || 12;
  return `${h}:00${suffix}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function number(value: number) {
  return new Intl.NumberFormat().format(value);
}

function StoryBody({ stats, publicMode = false }: { stats: ChatStats | PublicSnapshot; publicMode?: boolean }) {
  const maxYear = Math.max(...stats.byYear.map((y) => y.messages), 1);
  const topWords = "topWords" in stats ? stats.topWords : undefined;
  const lead = stats.participants[0]?.name ?? "You";
  const second = stats.participants[1]?.name;
  return <div className="story">
    <section className="story-hero">
      <div><small>{publicMode ? "A ThreadTale" : "Your ThreadTale"}</small><h2>{number(stats.totalMessages)} messages.<br/>Still talking.</h2></div>
      <p>{lead}{second ? ` + ${second}` : ""} · {number(stats.daysTogether)} days · {formatDate(stats.firstTimestamp)} → {formatDate(stats.lastTimestamp)}</p>
    </section>

    <div className="story-grid">
      <article className="story-card"><h3>Longest streak</h3><div className="story-number">{stats.longestStreak}</div><div className="story-sub">days in a row with at least one message</div></article>
      <article className="story-card"><h3>Peak chaos hour</h3><div className="story-number">{formatHour(stats.peakHour)}</div><div className="story-sub">apparently sleep was optional</div></article>
      <article className="story-card wide"><h3>Who carried the chat?</h3><div className="bars">{stats.participants.slice(0,5).map((p) => <div className="bar-line" key={p.name}><div className="bar-name">{p.name}</div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(2,p.percentage)}%`}}/></div><div className="bar-value">{p.percentage}%</div></div>)}</div></article>
      <article className="story-card"><h3>Questions asked</h3><div className="story-number">{number(stats.questionsAsked)}</div><div className="story-sub">curiosity, confusion, or both</div></article>
      <article className="story-card"><h3>After-midnight energy</h3><div className="story-number">{number(stats.lateNightMessages)}</div><div className="story-sub">messages sent between midnight and 5am</div></article>
      <article className="story-card wide"><h3>Your vibe</h3><div className="vibes"><div className="vibe"><strong>{stats.vibe.affection}</strong><span>affection</span></div><div className="vibe"><strong>{stats.vibe.chaos}</strong><span>chaos</span></div><div className="vibe"><strong>{stats.vibe.curiosity}</strong><span>curiosity</span></div><div className="vibe"><strong>{stats.vibe.nightOwl}</strong><span>night owl</span></div></div></article>
      <article className="story-card wide"><h3>The years</h3><div className="timeline">{stats.byYear.map((y) => <div className="year-col" key={y.year}><div className="year-bar" title={`${number(y.messages)} messages`} style={{height:`${Math.max(8,(y.messages/maxYear)*126)}px`}}/><small>{y.year}</small></div>)}</div></article>
      {topWords?.length ? <article className="story-card wide"><h3>Words that kept showing up</h3><div className="word-cloud">{topWords.map((w) => <span className="word" key={w.word}>{w.word} · {w.count}</span>)}</div></article> : null}
      <article className="story-card"><h3>Laugh signals</h3><div className="story-number">{number(stats.laughSignals)}</div><div className="story-sub">lol, haha, 😂 and 🤣</div></article>
      <article className="story-card"><h3>Heart signals</h3><div className="story-number">{number(stats.heartSignals)}</div><div className="story-sub">tiny digital affection trail</div></article>
    </div>
  </div>;
}

export function WrappedStory({ stats }: { stats: ChatStats }) {
  const [includeTopWords, setIncludeTopWords] = useState(false);
  const [includeNames, setIncludeNames] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = encodeSnapshot(createSnapshot(stats, { includeTopWords, includeNames }));
    return `${window.location.origin}/share#${payload}`;
  }, [stats, includeTopWords, includeNames]);

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <>
    <StoryBody stats={stats} />
    <div className="story share-panel">
      <h3>Make a privacy-safe share page</h3>
      <p>The link contains only the derived stats shown above. Raw messages are never embedded. Top words are excluded unless you explicitly include them.</p>
      <label className="toggle"><input type="checkbox" checked={includeNames} onChange={(e)=>setIncludeNames(e.target.checked)}/> Show participant names in the public link</label>
      <label className="toggle"><input type="checkbox" checked={includeTopWords} onChange={(e)=>setIncludeTopWords(e.target.checked)}/> Include top words in the public link</label>
      <div className="share-actions"><input className="share-input" readOnly value={shareUrl}/><button className="btn btn-primary" onClick={copyShare}>{copied ? "Copied ✓" : "Copy share link"}</button>{typeof navigator !== "undefined" && "share" in navigator ? <button className="btn btn-soft" onClick={()=>navigator.share({title:"Our ThreadTale",url:shareUrl})}>Share…</button> : null}</div>
    </div>
  </>;
}

export function PublicStory({ snapshot }: { snapshot: PublicSnapshot }) {
  return <StoryBody stats={snapshot} publicMode />;
}
