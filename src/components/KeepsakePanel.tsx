"use client";

import { useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { buildThreadTaleBookSpec } from "@/platform/print/threadtales-book";

export function KeepsakePanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [title, setTitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [trimSize, setTrimSize] = useState<"6x9" | "8x10">("6x9");
  const spec = useMemo(() => buildThreadTaleBookSpec(stats, mode, { title, dedication, trimSize }), [stats, mode, title, dedication, trimSize]);

  return <section className="story keepsake-panel">
    <span className="story-summary-kicker">Keepsake engine</span>
    <h3>Preview a print-ready storybook.</h3>
    <p>The book model uses the same derived story chapters as the web experience. It never needs the imported chat text.</p>
    <div className="keepsake-fields"><label>Cover title<input className="share-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={spec.cover.title}/></label><label>Trim size<select className="select" value={trimSize} onChange={(event) => setTrimSize(event.target.value as "6x9" | "8x10")}><option value="6x9">6 × 9 in</option><option value="8x10">8 × 10 in</option></select></label><label className="wide">Dedication<textarea className="share-input" rows={3} value={dedication} onChange={(event) => setDedication(event.target.value)} placeholder="Write something personal…"/></label></div>
    <div className="print-preview"><div className="print-cover"><small>{spec.trimSize} · {spec.bleed} in bleed</small><h3>{spec.cover.title}</h3><p>{spec.cover.subtitle}</p></div><div className="print-pages"><strong>{spec.pages.length}</strong><span>generated pages</span><small>vendor-neutral layout model</small></div></div>
    <div className="premium-actions"><button className="btn btn-soft" onClick={() => window.print()}>Print / Save PDF</button></div>
    <div className="print-book" aria-hidden="true"><article className="print-page print-page-cover"><h1>{spec.cover.title}</h1><p>{spec.cover.subtitle}</p></article>{spec.pages.map((page) => <article className="print-page" key={page.id}><small>{page.kind}</small><h2>{page.title}</h2>{page.metric !== undefined ? <strong>{page.metric}</strong> : null}{page.body ? <p>{page.body}</p> : null}</article>)}</div>
  </section>;
}
