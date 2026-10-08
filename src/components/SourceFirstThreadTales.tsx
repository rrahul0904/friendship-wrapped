"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats } from "@/lib/types";
import { analyzeThreadTaleInput } from "@/platform/threadtales/worker-client";
import styles from "@/app/rebuild/rebuild-v2.module.css";

type SlideKind = "cover" | "beginning" | "scale" | "people" | "rhythm" | "streak" | "silence" | "chaos" | "signals" | "balance" | "timeline" | "poster";
type Slide = { kind: SlideKind; eyebrow: string; title: string; value?: string; body: string; note?: string; facts?: string[] };
type Stage = "idle" | "reading" | "story";

const PROCESSING_STEPS = [
  "Finding where the story begins…",
  "Measuring the rhythm…",
  "Looking for the loud days…",
  "Building twelve keepsake chapters…"
];

const dateLabel = (timestamp: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
const number = (value: number) => new Intl.NumberFormat("en").format(value);
const replyLabel = (minutes: number | null) => minutes == null ? "not enough data" : minutes < 1 ? "under a minute" : minutes < 60 ? `${Math.round(minutes)} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} hr` : `${(minutes / 1440).toFixed(1)} days`;
const xml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char] ?? char));

function wrap(value: string, max = 30, limit = 4) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
      if (lines.length === limit - 1) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < limit) lines.push(line);
  return lines.slice(0, limit);
}

function svgLines(lines: string[], x: number, startY: number, size: number, gap: number, fill: string, weight = 400) {
  return lines.map((line, index) => `<text x="${x}" y="${startY + index * gap}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${xml(line)}</text>`).join("");
}

function cardPalette(kind: SlideKind) {
  const palettes: Record<SlideKind, [string, string, string]> = {
    cover: ["#241633", "#a56dff", "#ff8d7f"],
    beginning: ["#102338", "#5bb8ff", "#8dd9ff"],
    scale: ["#352415", "#ffb65c", "#ffd18f"],
    people: ["#143126", "#59e7a8", "#b8ffd9"],
    rhythm: ["#2f1735", "#f58cff", "#8e6fff"],
    streak: ["#302616", "#ffd276", "#fff0b8"],
    silence: ["#0c1428", "#354f9c", "#718ac9"],
    chaos: ["#3a1518", "#ff5c50", "#ffb24f"],
    signals: ["#321837", "#ff77b7", "#ef78ff"],
    balance: ["#123134", "#51ded5", "#9afff6"],
    timeline: ["#191b3b", "#7a83ff", "#52bfff"],
    poster: ["#39213f", "#d398ff", "#ffb66d"]
  };
  return palettes[kind];
}

function makeCardSvg(slide: Slide) {
  const [base, accent, secondary] = cardPalette(slide.kind);
  const title = wrap(slide.title, 27, 4);
  const value = slide.value ? wrap(slide.value, slide.kind === "poster" ? 24 : 28, slide.kind === "poster" ? 2 : 4) : [];
  const body = wrap(slide.body, 50, 4);
  const facts = (slide.facts ?? []).slice(0, 4);
  const posterFacts = facts.map((fact, index) => `<rect x="90" y="${1060 + index * 120}" width="900" height="88" rx="28" fill="#ffffff" opacity=".08"/><text x="125" y="${1118 + index * 120}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${xml(fact)}</text>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${base}"/><stop offset="1" stop-color="#0d0b10"/></linearGradient></defs>
    <rect width="1080" height="1920" rx="72" fill="url(#bg)"/>
    <circle cx="880" cy="250" r="330" fill="${accent}" opacity=".24"/>
    <circle cx="150" cy="1650" r="350" fill="${secondary}" opacity=".13"/>
    <text x="90" y="165" fill="#d9ccff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" letter-spacing="5">${xml(slide.eyebrow.toUpperCase())}</text>
    ${svgLines(title, 90, 365, slide.kind === "poster" ? 78 : 72, 86, "#ffffff", 700)}
    ${value.length ? svgLines(value, 90, slide.kind === "poster" ? 820 : 790, slide.kind === "poster" ? 72 : 88, slide.kind === "poster" ? 82 : 98, "#ffffff", 700) : ""}
    ${slide.kind === "poster" ? posterFacts : svgLines(body, 90, 1220, 34, 52, "#d8d1de", 400)}
    ${slide.note ? `<text x="90" y="1645" fill="#9d93a3" font-family="Arial, Helvetica, sans-serif" font-size="26">${xml(slide.note.slice(0, 72))}</text>` : ""}
    <text x="90" y="1780" fill="#8f8498" font-family="Arial, Helvetica, sans-serif" font-size="26" letter-spacing="2">THREADTALES · PROCESSED ON THIS DEVICE</text>
  </svg>`;
}

async function makeCardFile(slide: Slide, chapter: number) {
  const svg = makeCardSvg(slide);
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render this keepsake."));
      image.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare this keepsake.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export this keepsake.")), "image/png", 0.94));
    return new File([png], `threadtales-${chapter}.png`, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function buildSlides(stats: ChatStats): Slide[] {
  const people = [...stats.participants].sort((a, b) => b.messages - a.messages);
  const isGroup = people.length > 2;
  const names = people.map((person) => person.name).join(isGroup ? ", " : " + ");
  const first = people[0];
  const second = people[1];
  const starter = [...people].sort((a, b) => b.conversationStarts - a.conversationStarts)[0];
  const fastest = [...people]
    .filter((person) => person.medianReplyMinutes != null)
    .sort((a, b) => (a.medianReplyMinutes ?? Infinity) - (b.medianReplyMinutes ?? Infinity))[0];

  const slides: Slide[] = [
    { kind: "cover", eyebrow: "Your conversation", title: isGroup ? "This group built a history." : "This is the story you kept writing.", value: names, body: `${dateLabel(stats.firstTimestamp)} → ${dateLabel(stats.lastTimestamp)}`, note: "Processed on this device" },
    { kind: "beginning", eyebrow: "Where it starts", title: isGroup ? "Every group has a first day." : "Before all the patterns, there was a first message.", value: dateLabel(stats.firstTimestamp), body: `${number(stats.daysTogether)} calendar days separate the first message in this export from the last.` },
    { kind: "scale", eyebrow: "The scale", title: "A lot happened between hello and now.", value: number(stats.totalMessages), body: `${number(stats.activeDays)} active days · ${number(stats.totalWords)} words` }
  ];

  if (isGroup) {
    slides.push(
      { kind: "people", eyebrow: "The cast", title: "Some people carried more of the room.", value: people.slice(0, 3).map((person, index) => `${index + 1}. ${person.name} · ${person.percentage.toFixed(0)}%`).join("  /  "), body: `${people.length} people appear in this export. This is participation, not personality.` },
      { kind: "rhythm", eyebrow: "Who starts it", title: "The chat usually wakes up because someone does.", value: starter ? `${starter.name} · ${number(starter.conversationStarts)}` : "—", body: "Conversation starts are counted from measured gaps in the export." },
      { kind: "streak", eyebrow: "Reply rhythm", title: "Somebody tends to answer before the room settles.", value: fastest ? fastest.name : replyLabel(stats.medianReplyMinutes), body: fastest ? `${replyLabel(fastest.medianReplyMinutes)} median measured reply time` : "There is not enough reply-gap data to rank this group.", note: "Timing only. No claim about attention or intent." }
    );
  } else {
    slides.push(
      { kind: "people", eyebrow: "Who reaches first", title: "Someone usually breaks the silence.", value: starter ? starter.name : "—", body: starter ? `${number(starter.conversationStarts)} measured conversation starts` : "Not enough data to call it." },
      { kind: "rhythm", eyebrow: "Reply rhythm", title: "This is the pace you settled into.", value: replyLabel(stats.medianReplyMinutes), body: first && second ? `${first.name}: ${replyLabel(first.medianReplyMinutes)} · ${second.name}: ${replyLabel(second.medianReplyMinutes)}` : "Measured from reply gaps in the export.", note: "Timing only. No claim about attention or intent." },
      { kind: "streak", eyebrow: "Staying power", title: "You kept coming back.", value: `${number(stats.longestStreak)} days`, body: "Longest run of consecutive active messaging days in this export." }
    );
  }

  slides.push(
    { kind: "silence", eyebrow: "The quiet stretch", title: "And then there was the silence.", value: `${number(stats.longestSilenceDays)} days`, body: "Longest measured gap between active chat days. The number says how long, not why." },
    { kind: "chaos", eyebrow: "Peak chaos", title: "One day was louder than the rest.", value: number(stats.biggestDay.messages), body: `${dateLabel(stats.biggestDay.timestamp)} · favorite weekday ${stats.favoriteWeekday} · peak hour ${String(stats.peakHour).padStart(2, "0")}:00` },
    { kind: "signals", eyebrow: "Signals", title: "The things that kept showing up.", value: `♡ ${number(stats.heartSignals)}   😂 ${number(stats.laughSignals)}`, body: `${number(stats.questionsAsked)} questions · ${number(stats.lateNightMessages)} late-night messages`, note: "Counts only. No sentiment or psychological labels." },
    { kind: "balance", eyebrow: isGroup ? "Participation" : "Balance", title: isGroup ? "How evenly the room was shared." : "How evenly the conversation was carried.", value: `${Math.round(stats.conversationBalance)} / 100`, body: isGroup ? people.slice(0, 4).map((person) => `${person.name} ${person.percentage.toFixed(0)}%`).join(" · ") : people.map((person) => `${person.name} ${person.percentage.toFixed(0)}%`).join(" · ") },
    { kind: "timeline", eyebrow: "Across time", title: "The story changed shape as the years moved.", value: stats.byYear.slice(-4).map((row) => `${row.year} · ${number(row.messages)}`).join("  /  "), body: `${number(stats.daysTogether)} calendar days from the first message in this export to the last.` },
    { kind: "poster", eyebrow: "Keep this one", title: isGroup ? "Same room. Different eras. Still here." : "Still talking. That is the whole point.", value: names, body: `${dateLabel(stats.firstTimestamp)} → ${dateLabel(stats.lastTimestamp)}`, facts: [`${number(stats.totalMessages)} messages`, `${number(stats.activeDays)} active days`, `${number(stats.longestStreak)} day longest streak`, `${number(stats.laughSignals + stats.heartSignals)} laugh + heart signals`], note: "No raw message text is included in this keepsake." }
  );

  return slides;
}

export function SourceFirstThreadTales() {
  const [stage, setStage] = useState<Stage>("idle");
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [processingIndex, setProcessingIndex] = useState(0);
  const [shareStatus, setShareStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<number | null>(null);
  const slides = useMemo(() => stats ? buildSlides(stats) : [], [stats]);
  const next = useCallback(() => setIndex((current) => Math.min(current + 1, Math.max(slides.length - 1, 0))), [slides.length]);
  const previous = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

  useEffect(() => {
    if (stage !== "reading") return;
    setProcessingIndex(0);
    const timer = window.setInterval(() => setProcessingIndex((current) => Math.min(current + 1, PROCESSING_STEPS.length - 1)), 520);
    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "story") return;
    const onKey = (event: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); next(); }
      if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); previous(); }
      if (event.key === "Home") setIndex(0);
      if (event.key === "End") setIndex(Math.max(slides.length - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, previous, slides.length, stage]);

  async function analyze(text: string, name = "threadtales-demo.txt", type = "text/plain") {
    setStage("reading");
    setError("");
    setShareStatus("");
    setIndex(0);
    try {
      const [parsed] = await Promise.all([analyzeThreadTaleInput({ name, type, size: new Blob([text]).size, text }, "auto"), new Promise((resolve) => window.setTimeout(resolve, 2100))]);
      setStats(parsed.stats);
      setStage("story");
    } catch (cause) {
      setStats(null);
      setStage("idle");
      setError(cause instanceof Error ? cause.message : "That export could not be read.");
    }
  }

  async function choose(file?: File) {
    if (!file) return;
    if (!/\.(txt|json)$/i.test(file.name)) { setError("Choose a WhatsApp .txt or single-chat Telegram .json export."); return; }
    await analyze(await file.text(), file.name, file.type || (file.name.toLowerCase().endsWith(".json") ? "application/json" : "text/plain"));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function share(slide: Slide) {
    setShareStatus("");
    try {
      const text = [slide.title, slide.value, slide.body, "Made with ThreadTales"].filter(Boolean).join("\n");
      const file = await makeCardFile(slide, index + 1);
      if (navigator.share && navigator.canShare?.({ files: [file] })) { await navigator.share({ title: "ThreadTales", text, files: [file] }); setShareStatus("Share sheet opened with your keepsake image."); return; }
      if (navigator.share) { await navigator.share({ title: "ThreadTales", text }); setShareStatus("Share sheet opened with a safe text summary."); return; }
      await navigator.clipboard?.writeText(text);
      setShareStatus("Share text copied. Save the image if you want to attach the visual card.");
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      setShareStatus("Sharing did not open. You can still save the keepsake image.");
    }
  }

  async function save(slide: Slide) {
    setShareStatus("");
    try {
      const file = await makeCardFile(slide, index + 1);
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setShareStatus(index === slides.length - 1 ? "Your closing keepsake is saved." : "This chapter is saved as a 1080×1920 PNG.");
    } catch { setShareStatus("This browser could not save the image. Try Share instead."); }
  }

  function restart() { setStage("idle"); setStats(null); setIndex(0); setShareStatus(""); }

  if (stage === "reading") {
    return <main className={styles.processingShell} aria-live="polite"><section className={styles.processingCard}><p className={styles.eyebrow}>Building your ThreadTale</p><div className={styles.processingOrb} aria-hidden="true"><span>{processingIndex + 1}</span></div><h1>{PROCESSING_STEPS[processingIndex]}</h1><div className={styles.processingTrack} aria-hidden="true">{PROCESSING_STEPS.map((step, position) => <span key={step} className={position <= processingIndex ? styles.processingOn : ""}/>)}</div><p>Everything here is measured from the export in this browser. Raw messages are not being sent to an API.</p></section></main>;
  }

  if (stage === "story" && stats && slides[index]) {
    const slide = slides[index];
    const finalChapter = index === slides.length - 1;
    return <main className={styles.storyShell} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current == null) return; const end = event.changedTouches[0]?.clientX ?? touchStart.current; const delta = end - touchStart.current; if (delta < -48) next(); if (delta > 48) previous(); touchStart.current = null; }}>
      <div className={styles.progress} aria-label={`Chapter ${index + 1} of ${slides.length}`}>{slides.map((_, position) => <span key={position} className={position <= index ? styles.progressOn : ""}/>)}</div>
      <section className={styles.storyCard} data-kind={slide.kind} data-testid="threadtales-story-card" aria-live="polite" onClick={() => { if (!finalChapter) next(); }}>
        <div className={styles.chapterMeta}>Chapter {String(index + 1).padStart(2, "0")} / {slides.length}</div><p className={styles.eyebrow}>{slide.eyebrow}</p><h1>{slide.title}</h1>{slide.value ? <div className={styles.bigValue}>{slide.value}</div> : null}{slide.kind === "poster" && slide.facts ? <div className={styles.posterFacts}>{slide.facts.map((fact) => <span key={fact}>{fact}</span>)}</div> : <p className={styles.storyBody}>{slide.body}</p>}{slide.kind === "poster" ? <p className={styles.posterDate}>{slide.body}</p> : null}{slide.note ? <p className={styles.note}>{slide.note}</p> : null}<span className={styles.tapCue}>{finalChapter ? "Save the keepsake or send it back to the people in it" : "Tap the card or swipe to continue"}</span>
      </section>
      <div className={styles.storyFooter}><nav className={styles.storyNav} aria-label="Story controls"><button onClick={(event) => { event.stopPropagation(); previous(); }} disabled={index === 0} aria-label="Previous chapter">←</button><button onClick={(event) => { event.stopPropagation(); void share(slide); }}>Share</button><button onClick={(event) => { event.stopPropagation(); void save(slide); }}>{finalChapter ? "Save keepsake" : "Save card"}</button>{!finalChapter ? <button onClick={(event) => { event.stopPropagation(); next(); }} aria-label="Next chapter">Next →</button> : <button onClick={(event) => { event.stopPropagation(); restart(); }}>Another chat</button>}</nav>{shareStatus ? <p className={styles.shareStatus} role="status">{shareStatus}</p> : null}</div>
    </main>;
  }

  return <main className={styles.landing}><div className={styles.glow} aria-hidden="true"/><section className={styles.hero}><p className={styles.eyebrow}>ThreadTales</p><h1>Your chats already contain a story.</h1><p className={styles.lead}>Choose one conversation. ThreadTales reads it on this device and turns the history into twelve private, swipeable keepsake chapters.</p><div className={styles.actions}><input ref={fileRef} className={styles.hiddenInput} type="file" accept=".txt,.json,text/plain,application/json" onChange={(event) => void choose(event.target.files?.[0])}/><button className={styles.primary} onClick={() => fileRef.current?.click()}>Choose a chat export</button><button className={styles.demoAction} onClick={() => void analyze(makeSampleChat())}>See a demo first →</button></div><details className={styles.privacyDetails}><summary>● Processed on this device</summary><p>Raw messages stay in browser memory. No account is required and the core story does not need AI. Shared cards contain only the derived chapter you choose.</p></details>{error ? <p className={styles.error} role="alert">{error}</p> : null}</section></main>;
}
