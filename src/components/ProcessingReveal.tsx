"use client";

import { useEffect, useState } from "react";

const steps = [
  "Reading your timeline…",
  "Finding the first message…",
  "Measuring the chaos…",
  "Detecting laugh signals…",
  "Building your story chapters…",
  "Preparing share-safe facts…",
];

export function ProcessingReveal() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((value) => Math.min(steps.length - 1, value + 1)), 720);
    return () => window.clearInterval(timer);
  }, []);

  return <section className="mc-processing" aria-live="polite" aria-label="Local analysis progress">
    <div className="mc-processing-head"><span className="mc-processing-pulse" aria-hidden="true"/><div><small>Local analysis active</small><strong>{steps[active]}</strong></div><span className="mc-processing-percent">{Math.round(((active + 1) / steps.length) * 100)}%</span></div>
    <div className="mc-processing-track" aria-hidden="true">{steps.map((step, index) => <i key={step} className={index <= active ? "active" : ""}/>)}</div>
    <div className="mc-processing-meta"><span>Browser memory only</span><span>Web Worker when available</span><span>No raw-chat upload</span></div>
  </section>;
}
