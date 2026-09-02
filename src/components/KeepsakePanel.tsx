"use client";

import { useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { buildThreadTaleBookSpec } from "@/platform/print/threadtales-book";

type KeepsakeStep = "cover" | "dedication" | "preview";
const KEEPSAKE_STEPS: Array<{ id: KeepsakeStep; label: string; hint: string }> = [
  { id: "cover", label: "Cover", hint: "Title · dates · trim" },
  { id: "dedication", label: "Dedication", hint: "A note that makes it yours" },
  { id: "preview", label: "Preview & PDF", hint: "Review the book before saving" },
];

export function KeepsakePanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dedication, setDedication] = useState("");
  const [trimSize, setTrimSize] = useState<"6x9" | "8x10">("6x9");
  const [step, setStep] = useState<KeepsakeStep>("cover");
  const spec = useMemo(() => buildThreadTaleBookSpec(stats, mode, { title, subtitle, dedication, trimSize }), [stats, mode, title, subtitle, dedication, trimSize]);

  return <section className="story keepsake-panel mc-keepsake" aria-label="ThreadTales keepsake builder">
    <div className="mc-keepsake-intro"><span className="story-summary-kicker">Keepsake engine</span><h3>Turn the story into something that feels worth keeping.</h3><p>The book uses the same derived chapters as the web experience. Browser “Print / Save PDF” is the current output path; physical print fulfillment is not claimed.</p></div>
    <nav className="mc-keepsake-steps" aria-label="Keepsake builder steps">{KEEPSAKE_STEPS.map((item, index) => <button key={item.id} type="button" className={step === item.id ? "is-active" : ""} aria-current={step === item.id ? "step" : undefined} onClick={() => setStep(item.id)}><span>{index + 1}</span><strong>{item.label}</strong><small>{item.hint}</small></button>)}</nav>

    <div className="mc-keepsake-workspace">
      <div className="mc-keepsake-editor">
        <section className={`mc-keepsake-step ${step === "cover" ? "is-active" : ""}`} aria-label="Keepsake cover settings">
          <span className="mc-step-kicker">01 · Cover</span><h4>Set the tone before the first page.</h4>
          <label>Cover title<input className="share-input" value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} placeholder={spec.cover.title}/></label>
          <label>Cover subtitle / date line<input className="share-input" value={subtitle} maxLength={220} onChange={(event) => setSubtitle(event.target.value)} placeholder={spec.cover.subtitle}/></label>
          <label>Trim size<select className="select" value={trimSize} onChange={(event) => setTrimSize(event.target.value as "6x9" | "8x10")}><option value="6x9">6 × 9 in · intimate storybook</option><option value="8x10">8 × 10 in · larger memory book</option></select></label>
          <button className="btn btn-primary mc-mobile-next" type="button" onClick={() => setStep("dedication")}>Continue to dedication →</button>
        </section>

        <section className={`mc-keepsake-step ${step === "dedication" ? "is-active" : ""}`} aria-label="Keepsake dedication settings">
          <span className="mc-step-kicker">02 · Dedication</span><h4>Write the line only the two of you would understand.</h4>
          <label>Dedication<textarea className="share-input" rows={6} value={dedication} maxLength={1200} onChange={(event) => setDedication(event.target.value)} placeholder="For all the late nights, impossible voice notes, and the ordinary days that became our favorite ones…"/></label>
          <div className="mc-keepsake-note"><strong>Private editing</strong><p>This text stays in the browser-side keepsake model unless you explicitly save or print the result.</p></div>
          <button className="btn btn-primary mc-mobile-next" type="button" onClick={() => setStep("preview")}>Preview the book →</button>
        </section>
      </div>

      <aside className={`mc-book-preview ${step === "preview" ? "is-active" : ""}`} aria-label="Keepsake page preview">
        <div className="mc-book-stage">
          <article className="mc-book-cover"><small>ThreadTales · Paper edition</small><div><h3>{spec.cover.title}</h3><p>{spec.cover.subtitle}</p></div><span>{spec.trimSize} · {spec.bleed} in bleed</span></article>
          <article className="mc-book-page-peek"><small>Dedication</small><p>{dedication.trim() || "Your dedication will appear here."}</p></article>
        </div>
        <div className="mc-book-meta"><div><strong>{spec.pages.length}</strong><span>generated pages</span></div><div><strong>{trimSize === "6x9" ? "6 × 9" : "8 × 10"}</strong><span>trim size</span></div><div><strong>Local</strong><span>browser print path</span></div></div>
        <ol className="mc-page-map" aria-label="Keepsake page map">{spec.pages.slice(0, 5).map((page, index) => <li key={page.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{page.title}</strong><small>{page.kind}</small></div></li>)}</ol>
        <button className="btn btn-primary mc-print-action" onClick={() => window.print()}>Print / Save PDF</button>
        <small className="mc-print-disclaimer">This opens your browser’s print dialog. No commercial print order is created.</small>
      </aside>
    </div>

    <div className="print-book" aria-hidden="true"><article className="print-page print-page-cover"><h1>{spec.cover.title}</h1><p>{spec.cover.subtitle}</p></article>{spec.pages.map((page) => <article className="print-page" key={page.id}><small>{page.kind}</small><h2>{page.title}</h2>{page.metric !== undefined ? <strong>{page.metric}</strong> : null}{page.body ? <p>{page.body}</p> : null}</article>)}</div>
  </section>;
}
