"use client";

import { useMemo, useState } from "react";
import type { ChatStats, PublicSnapshot, StoryMode } from "@/lib/types";
import { createSnapshot, encodeSnapshot } from "@/lib/share";
import { StoryChapterDeck } from "./StoryChapterDeck";
import { getStoryModeConfig } from "@/platform/story/modes";

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const h = hour % 12 || 12;
  return `${h}:00${suffix}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
}

function shortDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(timestamp));
}

function number(value: number) {
  return new Intl.NumberFormat().format(value);
}

function replyTime(minutes: number | null | undefined) {
  if (minutes == null) return "—";
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 1_440) return `${(minutes / 60).toFixed(minutes < 120 ? 1 : 0)} hr`;
  return `${(minutes / 1_440).toFixed(1)} days`;
}

function vibeName(vibe: ChatStats["vibe"]) {
  if (vibe.affection >= 72 && vibe.chaos >= 65) return "Chaotic softies";
  if (vibe.chaos >= 76) return "Beautifully unhinged";
  if (vibe.nightOwl >= 72) return "Midnight committee";
  if (vibe.curiosity >= 72) return "Question department";
  if (vibe.affection >= 72) return "Soft-hearted regulars";
  return "Always in orbit";
}

function StoryBody({ stats, mode, publicMode = false }: { stats: ChatStats | PublicSnapshot; mode: StoryMode; publicMode?: boolean }) {
  const maxYear = Math.max(...stats.byYear.map((y) => y.messages), 1);
  const topWords = "topWords" in stats ? stats.topWords : undefined;
  const lead = stats.participants[0]?.name ?? "You";
  const second = stats.participants[1]?.name;
  const copy = getStoryModeConfig(mode);
  const activeRate = Math.min(100, Math.round((stats.activeDays / Math.max(1, stats.daysTogether)) * 100));
  const totalStarts = stats.participants.reduce((sum, p) => sum + (p.conversationStarts ?? 0), 0);
  const dayparts = stats.dayparts;
  const biggestDay = stats.biggestDay;
  const quietDays = stats.longestSilenceDays;
  const medianReply = stats.medianReplyMinutes;

  return <div className="story">
    <section className="story-hero">
      <div><small>{publicMode ? `A ThreadTale · ${copy.noun}` : copy.eyebrow}</small><h2>{number(stats.totalMessages)} messages.<br/>{copy.ending}</h2></div>
      <p>{lead}{second ? ` + ${second}` : ""} · {number(stats.daysTogether)} days · {formatDate(stats.firstTimestamp)} → {formatDate(stats.lastTimestamp)}</p>
    </section>

    <section className="story-summary">
      <span className="story-summary-kicker">The short version</span>
      <strong>{vibeName(stats.vibe)}.</strong>
      <p>You showed up on {number(stats.activeDays)} different days, stayed active through {activeRate}% of the calendar span, and somehow turned {stats.favoriteWeekday}s into your unofficial meeting day.</p>
    </section>

    <div className="story-grid">
      <article className="story-card"><h3>The beginning</h3><div className="story-number story-number-date">{shortDate(stats.firstTimestamp)}</div><div className="story-sub">{new Date(stats.firstTimestamp).getFullYear()} · where this chat history starts</div></article>
      <article className="story-card"><h3>Longest streak</h3><div className="story-number">{stats.longestStreak}</div><div className="story-sub">days in a row with at least one message</div></article>
      {biggestDay ? <article className="story-card"><h3>Biggest chat day</h3><div className="story-number story-number-date">{shortDate(biggestDay.timestamp)}</div><div className="story-sub">{number(biggestDay.messages)} messages in one day</div></article> : null}
      <article className="story-card"><h3>Typical reply</h3><div className="story-number story-number-date">{replyTime(medianReply)}</div><div className="story-sub">median reply time when the sender changed</div></article>
      <article className="story-card"><h3>Peak chaos hour</h3><div className="story-number story-number-date">{formatHour(stats.peakHour)}</div><div className="story-sub">apparently sleep was optional</div></article>
      {quietDays !== undefined ? <article className="story-card"><h3>Longest quiet spell</h3><div className="story-number">{quietDays}</div><div className="story-sub">days with no messages between active days</div></article> : null}

      <article className="story-card wide"><h3>Who carried the chat?</h3><div className="bars">{stats.participants.slice(0,5).map((p) => <div className="bar-line" key={p.name}><div className="bar-name">{p.name}</div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(2,p.percentage)}%`}}/></div><div className="bar-value">{p.percentage}%</div></div>)}</div></article>

      {totalStarts > 0 ? <article className="story-card wide"><h3>Who restarts the conversation?</h3><div className="bars">{stats.participants.slice(0,5).map((p) => {
        const starts = p.conversationStarts ?? 0;
        const percent = totalStarts ? (starts / totalStarts) * 100 : 0;
        return <div className="bar-line" key={p.name}><div className="bar-name">{p.name}</div><div className="bar-track"><div className="bar-fill alt" style={{width:`${Math.max(starts ? 2 : 0,percent)}%`}}/></div><div className="bar-value">{starts}</div></div>;
      })}</div><div className="story-sub story-sub-space">A new conversation starts after more than six quiet hours.</div></article> : null}

      <article className="story-card"><h3>Questions asked</h3><div className="story-number">{number(stats.questionsAsked)}</div><div className="story-sub">curiosity, confusion, or both</div></article>
      <article className="story-card"><h3>After-midnight energy</h3><div className="story-number">{number(stats.lateNightMessages)}</div><div className="story-sub">messages sent between midnight and 5am</div></article>

      {dayparts ? <article className="story-card wide"><h3>Your daily rhythm</h3><div className="daypart-grid">{Object.entries(dayparts).map(([label, count]) => {
        const pct = Math.round((count / Math.max(1, stats.totalMessages)) * 100);
        return <div className="daypart" key={label}><strong>{pct}%</strong><span>{label}</span><small>{number(count)} messages</small></div>;
      })}</div></article> : null}

      <article className="story-card wide"><h3>Your cast</h3><div className="personality-grid">{stats.participants.slice(0,4).map((p) => <div className="personality" key={p.name}><strong>{p.name}</strong><span>{p.avgWords != null ? `${p.avgWords} words/message` : `${p.percentage}% of messages`}</span><span>{p.conversationStarts != null ? `${p.conversationStarts} conversation starts` : `${number(p.messages)} messages`}</span><span>{p.medianReplyMinutes != null ? `${replyTime(p.medianReplyMinutes)} median reply` : "reply speed unavailable"}</span></div>)}</div></article>

      <article className="story-card wide"><h3>Your vibe</h3><div className="vibes"><div className="vibe"><strong>{stats.vibe.affection}</strong><span>affection</span></div><div className="vibe"><strong>{stats.vibe.chaos}</strong><span>chaos</span></div><div className="vibe"><strong>{stats.vibe.curiosity}</strong><span>curiosity</span></div><div className="vibe"><strong>{stats.vibe.nightOwl}</strong><span>night owl</span></div></div></article>
      <article className="story-card wide"><h3>The years</h3><div className="timeline">{stats.byYear.map((y) => <div className="year-col" key={y.year}><div className="year-bar" title={`${number(y.messages)} messages`} style={{height:`${Math.max(8,(y.messages/maxYear)*126)}px`}}/><small>{y.year}</small></div>)}</div></article>
      {topWords?.length ? <article className="story-card wide"><h3>Words that kept showing up</h3><div className="word-cloud">{topWords.map((w) => <span className="word" key={w.word}>{w.word} · {w.count}</span>)}</div></article> : null}
      <article className="story-card"><h3>Laugh signals</h3><div className="story-number">{number(stats.laughSignals)}</div><div className="story-sub">lol, haha, 😂 and 🤣</div></article>
      <article className="story-card"><h3>Heart signals</h3><div className="story-number">{number(stats.heartSignals)}</div><div className="story-sub">tiny digital affection trail</div></article>
    </div>
  </div>;
}

export function WrappedStory({ stats, mode = "friends" }: { stats: ChatStats; mode?: StoryMode }) {
  const [includeTopWords, setIncludeTopWords] = useState(false);
  const [includeNames, setIncludeNames] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = getStoryModeConfig(mode);
  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const payload = encodeSnapshot(createSnapshot(stats, { includeTopWords, includeNames, mode }));
    return `${window.location.origin}/share#${payload}`;
  }, [stats, includeTopWords, includeNames, mode]);

  async function copyShare() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <>
    <StoryBody stats={stats} mode={mode} />
    <StoryChapterDeck stats={stats} mode={mode} />
    <div className="story share-panel">
      <h3>Turn this into something you can send</h3>
      <p>The link contains only the derived stats shown above. Raw messages are never embedded. Names and top words stay private unless you explicitly include them.</p>
      <label className="toggle"><input type="checkbox" checked={includeNames} onChange={(e)=>setIncludeNames(e.target.checked)}/> Show participant names in the public link</label>
      <label className="toggle"><input type="checkbox" checked={includeTopWords} onChange={(e)=>setIncludeTopWords(e.target.checked)}/> Include top words in the public link</label>
      <div className="share-actions"><input className="share-input" readOnly value={shareUrl}/><button className="btn btn-primary" onClick={copyShare}>{copied ? "Copied ✓" : "Copy share link"}</button>{typeof navigator !== "undefined" && "share" in navigator ? <button className="btn btn-soft" onClick={()=>navigator.share({title:"Our ThreadTale",text:`Our ${copy.noun} in numbers.`,url:shareUrl})}>Share…</button> : null}</div>
    </div>
  </>;
}

export function PublicStory({ snapshot }: { snapshot: PublicSnapshot }) {
  return <StoryBody stats={snapshot} mode={snapshot.mode ?? "friends"} publicMode />;
}
