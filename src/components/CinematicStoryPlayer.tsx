"use client";

import { useEffect, useRef, useState } from "react";
import type { StoryChapter, StoryThemeId } from "@/platform/types";
import { getStoryTheme, storyThemeBackground } from "@/platform/story/themes";

export function CinematicStoryPlayer({ chapters, themeId }: { chapters: StoryChapter[]; themeId: StoryThemeId }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const chapter = chapters[Math.min(index, Math.max(0, chapters.length - 1))];
  const theme = getStoryTheme(themeId);

  useEffect(() => {
    if (!playing || chapters.length < 2 || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setIndex((value) => {
        if (value >= chapters.length - 1) { setPlaying(false); return value; }
        return value + 1;
      });
    }, 3500);
    return () => window.clearInterval(timer);
  }, [playing, chapters.length]);

  if (!chapter) return null;

  function replay() { setIndex(0); setPlaying(true); }
  async function enterFullscreen() {
    const node = stageRef.current;
    if (!node || !node.requestFullscreen) return;
    await node.requestFullscreen();
  }

  return <section className={`story cinematic-player mc-cinematic theme-motion-${themeId}`} aria-label="Cinematic story playback">
    <div className="chapter-head mc-cinematic-head"><div><span className="story-summary-kicker">Cinematic recap</span><h3>Watch the memory unfold.</h3><p>The same deterministic chapters become a paced story reel. Reduced-motion preferences disable automatic progression.</p></div><span className="mc-local-chip">Local playback</span></div>
    <div ref={stageRef} className="cinematic-stage mc-cinematic-stage" style={{ background: storyThemeBackground(theme), color: theme.foreground }} aria-live="polite">
      <div className="mc-film-grain" aria-hidden="true"/><div className="mc-cinematic-copy"><small>{chapter.type.replace("-", " ")}</small><h3>{chapter.title}</h3>{chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}{chapter.subtitle ? <span>{chapter.subtitle}</span> : null}{chapter.supportingText ? <p>{chapter.supportingText}</p> : null}</div>
      <div className="cinematic-progress" aria-label={`Chapter ${index + 1} of ${chapters.length}`}>{chapters.map((item, itemIndex) => <i key={item.id} className={itemIndex <= index ? "active" : ""} />)}</div>
    </div>
    <div className="premium-actions mc-cinematic-controls"><button className="btn btn-primary" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button><button className="btn btn-soft" onClick={replay}>Replay</button><button className="btn btn-soft" disabled={index === 0} onClick={() => { setPlaying(false); setIndex((value) => Math.max(0, value - 1)); }}>Previous</button><button className="btn btn-soft" disabled={index === chapters.length - 1} onClick={() => { setPlaying(false); setIndex((value) => Math.min(chapters.length - 1, value + 1)); }}>Next</button><button className="btn btn-soft" onClick={() => void enterFullscreen()}>Full screen</button></div>
  </section>;
}
