"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeSampleChat } from "@/lib/sample";
import type { ChatStats } from "@/lib/types";
import { analyzeThreadTaleInput } from "@/platform/threadtales/worker-client";
import styles from "@/app/rebuild/rebuild.module.css";

type Slide = { eyebrow: string; title: string; value?: string; body: string; note?: string };
type Stage = "idle" | "reading" | "story";

const dateLabel = (timestamp: number) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(timestamp));
const number = (value: number) => new Intl.NumberFormat("en").format(value);
const replyLabel = (minutes: number | null) => minutes == null ? "not enough data" : minutes < 1 ? "under a minute" : minutes < 60 ? `${Math.round(minutes)} min` : minutes < 1440 ? `${(minutes / 60).toFixed(1)} hr` : `${(minutes / 1440).toFixed(1)} days`;
const xml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char] ?? char));

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
    {
      eyebrow: "Your conversation",
      title: isGroup ? "This group built a history." : "This is the story you kept writing.",
      value: names,
      body: `${dateLabel(stats.firstTimestamp)} → ${dateLabel(stats.lastTimestamp)}`,
      note: "Processed on this device"
    },
    {
      eyebrow: "Where it starts",
      title: isGroup ? "Every group has a first day." : "Before all the patterns, there was a first message.",
      value: dateLabel(stats.firstTimestamp),
      body: `${number(stats.daysTogether)} calendar days separate the first message in this export from the last.`
    },
    {
      eyebrow: "The scale",
      title: "A lot happened between hello and now.",
      value: number(stats.totalMessages),
      body: `${number(stats.activeDays)} active days · ${number(stats.totalWords)} words`
    }
  ];

  if (isGroup) {
    slides.push(
      {
        eyebrow: "The cast",
        title: "Some people carried more of the room.",
        value: people.slice(0, 3).map((person, index) => `${index + 1}. ${person.name} · ${person.percentage.toFixed(0)}%`).join("  /  "),
        body: `${people.length} people appear in this export. This is participation, not personality.`
      },
      {
        eyebrow: "Who starts it",
        title: "The chat usually wakes up because someone does.",
        value: starter ? `${starter.name} · ${number(starter.conversationStarts)}` : "—",
        body: "Conversation starts are counted from measured gaps in the export."
      },
      {
        eyebrow: "Reply rhythm",
        title: "Somebody tends to answer before the room settles.",
        value: fastest ? fastest.name : replyLabel(stats.medianReplyMinutes),
        body: fastest ? `${replyLabel(fastest.medianReplyMinutes)} median measured reply time` : "There is not enough reply-gap data to rank this group.",
        note: "Timing only. No claim about attention or intent."
      }
    );
  } else {
    slides.push(
      {
        eyebrow: "Who reaches first",
        title: "Someone usually breaks the silence.",
        value: starter ? starter.name : "—",
        body: starter ? `${number(starter.conversationStarts)} measured conversation starts` : "Not enough data to call it."
      },
      {
        eyebrow: "Reply rhythm",
        title: "This is the pace you settled into.",
        value: replyLabel(stats.medianReplyMinutes),
        body: first && second ? `${first.name}: ${replyLabel(first.medianReplyMinutes)} · ${second.name}: ${replyLabel(second.medianReplyMinutes)}` : "Measured from reply gaps in the export.",
        note: "Timing only. No claim about attention or intent."
      },
      {
        eyebrow: "Staying power",
        title: "You kept coming back.",
        value: `${number(stats.longestStreak)} days`,
        body: "Longest run of consecutive active messaging days in this export."
      }
    );
  }

  slides.push(
    {
      eyebrow: "The quiet stretch",
      title: "And then there was the silence.",
      value: `${number(stats.longestSilenceDays)} days`,
      body: "Longest measured gap between active chat days. The number says how long, not why."
    },
    {
      eyebrow: "Peak chaos",
      title: "One day was louder than the rest.",
      value: number(stats.biggestDay.messages),
      body: `${dateLabel(stats.biggestDay.timestamp)} · favorite weekday ${stats.favoriteWeekday} · peak hour ${String(stats.peakHour).padStart(2, "0")}:00`
    },
    {
      eyebrow: "Signals",
      title: "The things that kept showing up.",
      value: `♡ ${number(stats.heartSignals)}   😂 ${number(stats.laughSignals)}`,
      body: `${number(stats.questionsAsked)} questions · ${number(stats.lateNightMessages)} late-night messages`,
      note: "Counts only. No sentiment or psychological labels."
    },
    {
      eyebrow: isGroup ? "Participation" : "Balance",
      title: isGroup ? "How evenly the room was shared." : "How evenly the conversation was carried.",
      value: `${Math.round(stats.conversationBalance)} / 100`,
      body: isGroup ? people.slice(0, 4).map((person) => `${person.name} ${person.percentage.toFixed(0)}%`).join(" · ") : people.map((person) => `${person.name} ${person.percentage.toFixed(0)}%`).join(" · ")
    },
    {
      eyebrow: "Across time",
      title: "The story changed shape as the years moved.",
      value: stats.byYear.slice(-4).map((row) => `${row.year} · ${number(row.messages)}`).join("  /  "),
      body: `${number(stats.daysTogether)} calendar days from the first message in this export to the last.`
    },
    {
      eyebrow: "Keep this one",
      title: isGroup ? "Same room. Different eras. Still here." : "Still talking. That is the whole point.",
      value: number(stats.totalMessages),
      body: "Save this card, send it to the people in it, or start again with another conversation.",
      note: "No raw message text is included in this card."
    }
  );

  return slides;
}

export function SourceFirstThreadTales() {
  const [stage, setStage] = useState<Stage>("idle");
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const touchStart = useRef<number | null>(null);
  const slides = useMemo(() => stats ? buildSlides(stats) : [], [stats]);

  const next = useCallback(() => setIndex((current) => Math.min(current + 1, Math.max(slides.length - 1, 0))), [slides.length]);
  const previous = useCallback(() => setIndex((current) => Math.max(current - 1, 0)), []);

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
    setIndex(0);
    try {
      const parsed = await analyzeThreadTaleInput({ name, type, size: new Blob([text]).size, text }, "auto");
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
    await analyze(await file.text(), file.name, file.type || (file.name.endsWith(".json") ? "application/json" : "text/plain"));
    if (fileRef.current) fileRef.current.value = "";
  }

  async function share(slide: Slide) {
    const text = [slide.title, slide.value, slide.body, "Made with ThreadTales"].filter(Boolean).join("\n");
    if (navigator.share) {
      await navigator.share({ title: "ThreadTales", text }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(text);
  }

  function save(slide: Slide) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="1080" height="1920" rx="72" fill="#130f18"/><circle cx="880" cy="260" r="300" fill="#6f4cff" opacity=".28"/><circle cx="160" cy="1610" r="330" fill="#ff7b72" opacity=".18"/><text x="90" y="180" fill="#c7b8ff" font-family="Arial" font-size="32" letter-spacing="6">${xml(slide.eyebrow.toUpperCase())}</text><text x="90" y="390" fill="#fff" font-family="Arial" font-size="70" font-weight="700">${xml(slide.title.slice(0, 34))}</text><text x="90" y="500" fill="#fff" font-family="Arial" font-size="70" font-weight="700">${xml(slide.title.slice(34, 68))}</text><text x="90" y="820" fill="#fff" font-family="Arial" font-size="92" font-weight="700">${xml((slide.value ?? "").slice(0, 34))}</text><text x="90" y="1030" fill="#d8d1de" font-family="Arial" font-size="36">${xml(slide.body.slice(0, 58))}</text><text x="90" y="1090" fill="#d8d1de" font-family="Arial" font-size="36">${xml(slide.body.slice(58, 116))}</text><text x="90" y="1750" fill="#8f8498" font-family="Arial" font-size="28">THREADTALES · PROCESSED LOCALLY</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `threadtales-${index + 1}.svg`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (stage === "story" && stats && slides[index]) {
    const slide = slides[index];
    return <main className={styles.storyShell} onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => { if (touchStart.current == null) return; const end = event.changedTouches[0]?.clientX ?? touchStart.current; const delta = end - touchStart.current; if (delta < -48) next(); if (delta > 48) previous(); touchStart.current = null; }}>
      <div className={styles.progress} aria-label={`Chapter ${index + 1} of ${slides.length}`}>{slides.map((_, position) => <span key={position} className={position <= index ? styles.progressOn : ""}/>)}</div>
      <section className={styles.storyCard} aria-live="polite">
        <p className={styles.eyebrow}>{slide.eyebrow}</p>
        <h1>{slide.title}</h1>
        {slide.value ? <div className={styles.bigValue}>{slide.value}</div> : null}
        <p className={styles.storyBody}>{slide.body}</p>
        {slide.note ? <p className={styles.note}>{slide.note}</p> : null}
      </section>
      <nav className={styles.storyNav} aria-label="Story controls">
        <button onClick={previous} disabled={index === 0} aria-label="Previous chapter">←</button>
        <button onClick={() => void share(slide)}>Share</button>
        <button onClick={() => save(slide)}>Save card</button>
        {index < slides.length - 1 ? <button onClick={next} aria-label="Next chapter">Next →</button> : <button onClick={() => { setStage("idle"); setStats(null); setIndex(0); }}>Another chat</button>}
      </nav>
    </main>;
  }

  return <main className={styles.landing}>
    <div className={styles.glow} aria-hidden="true"/>
    <section className={styles.hero}>
      <p className={styles.eyebrow}>ThreadTales</p>
      <h1>Your chats already contain a story.</h1>
      <p className={styles.lead}>Drop one conversation. ThreadTales reads it on this device and turns the relationship into a private, swipeable keepsake.</p>
      <div className={styles.actions}>
        <input ref={fileRef} className={styles.hiddenInput} type="file" accept=".txt,.json,text/plain,application/json" onChange={(event) => void choose(event.target.files?.[0])}/>
        <button className={styles.primary} onClick={() => fileRef.current?.click()} disabled={stage === "reading"}>{stage === "reading" ? "Reading your history…" : "Choose a chat export"}</button>
        <button className={styles.secondary} onClick={() => void analyze(makeSampleChat())} disabled={stage === "reading"}>See a demo story</button>
      </div>
      <div className={styles.trust}><span>Raw messages stay here</span><span>No account</span><span>No AI required</span></div>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
    </section>
    <section className={styles.promise} aria-label="What you get">
      <article><strong>One conversation</strong><span>No dashboard maze.</span></article>
      <article><strong>Twelve story beats</strong><span>Pair and group chats get different editorial treatment.</span></article>
      <article><strong>Worth sending</strong><span>Every chapter can become a shareable keepsake.</span></article>
    </section>
  </main>;
}
