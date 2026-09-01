"use client";

import { useState } from "react";
import type { ThreadTalesLocalLore } from "@/platform/threadtales/lore";

export function LocalLorePanel({ lore }: { lore: ThreadTalesLocalLore }) {
  const [showFirstMessage, setShowFirstMessage] = useState(false);
  if (!lore.firstMessageText && lore.recurringPhrases.length === 0) return null;
  return <section className="story share-panel" aria-label="Local-only chat lore">
    <span className="story-summary-kicker">Local-only chat lore</span>
    <h3>Details that stay on this device</h3>
    <p>These are derived from raw message text in your browser. They are deliberately excluded from public share manifests, cloud saves, telemetry, Stripe metadata, and default AI requests.</p>
    {lore.firstMessageText ? <div className="builder-card"><h3>First message</h3>{showFirstMessage ? <p className="code-pill">{lore.firstMessageText}</p> : <p>The date is part of the normal story; the original text stays hidden until you reveal it here.</p>}<button className="btn btn-soft" onClick={() => setShowFirstMessage((value) => !value)}>{showFirstMessage ? "Hide first message" : "Reveal first message locally"}</button></div> : null}
    {lore.recurringPhrases.length ? <div className="builder-card"><h3>A phrase that kept coming back</h3><p>Candidate phrases are deterministic repeated 2–5 word sequences, not claims about an “inside joke.”</p><div className="word-cloud">{lore.recurringPhrases.map((item) => <span className="word" key={item.phrase}>{item.phrase} · {item.count}</span>)}</div></div> : null}
  </section>;
}
