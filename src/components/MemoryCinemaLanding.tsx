import Link from "next/link";

const flow = ["Import", "Private analysis", "Wrapped reveal", "Story chapters", "Cinematic recap", "Share / keep"];

export function ProductFlowStepper({ compact = false }: { compact?: boolean }) {
  return <div className={`mc-flow ${compact ? "compact" : ""}`} aria-label="ThreadTales product flow">
    {flow.map((item, index) => <div className="mc-flow-step" key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
  </div>;
}

export function PrivacyPromiseStrip() {
  const promises = [
    ["◉", "Private analysis", "Raw chat stays in browser memory by default."],
    ["⌁", "Browser-first", "Worker processing with a safe local fallback."],
    ["✦", "Share-safe stories", "Public links use derived facts, not transcripts."],
    ["▣", "Social-native", "9:16, 4:5 and square story artifacts."],
    ["⊘", "No raw-chat database", "Cloud features are explicit and derived-only."],
  ];
  return <section className="shell mc-promise-strip" aria-label="ThreadTales privacy promises">
    {promises.map(([icon, title, copy]) => <article key={title}><span aria-hidden="true">{icon}</span><div><strong>{title}</strong><small>{copy}</small></div></article>)}
  </section>;
}

export function LandingHero() {
  return <section className="mc-hero-wrap">
    <div className="shell mc-hero">
      <div className="mc-hero-copy">
        <span className="mc-eyebrow"><i /> Private by default · zero raw-chat upload</span>
        <h1>Your chats, turned into a <em>story worth sharing.</em></h1>
        <p>Private personal data becomes emotional, funny and beautiful story chapters in your browser—then you decide what leaves it.</p>
        <div className="hero-actions mc-hero-actions"><Link className="btn btn-primary" href="/create">Create my ThreadTale <span>→</span></Link><Link className="btn btn-soft" href="/create?demo=1">Try the demo</Link></div>
        <div className="mc-trust-row"><span>◉ No account required</span><span>◉ Raw messages stay local</span><span>◉ Share only what you choose</span></div>
      </div>
      <div className="mc-preview-stage" aria-hidden="true">
        <div className="mc-orbit mc-orbit-one"/><div className="mc-orbit mc-orbit-two"/>
        <article className="mc-preview-card mc-preview-main"><small>Our ThreadTale</small><strong>12,482</strong><h3>messages across 642 days</h3><div className="mc-preview-progress"><i/><i/><i/><i/></div><p>“Somehow Tuesday became your unofficial meeting day.”</p></article>
        <article className="mc-preview-card mc-preview-streak"><small>Longest streak</small><strong>38</strong><span>days without disappearing</span></article>
        <article className="mc-preview-card mc-preview-vibe"><small>Vibe check</small><strong>94</strong><span>chaotic softies</span></article>
        <article className="mc-preview-card mc-preview-hour"><small>Peak chaos</small><strong>1:14<span>am</span></strong><span>sleep was optional</span></article>
        <article className="mc-preview-card mc-preview-share"><span>↗</span><strong>Ready to share</strong><small>Derived story only</small></article>
      </div>
    </div>
  </section>;
}

export function StoryPreviewSection() {
  const chapters = [
    { eyebrow: "01 · The Beginning", title: "It started with one message.", body: "Aug 14, 2022 · the first day in this chat history", className: "midnight" },
    { eyebrow: "06 · Peak Chaos Hour", title: "Apparently 1am was a personality trait.", body: "1:14am · your most active hour", className: "neon" },
    { eyebrow: "09 · The Vibe Check", title: "Chaotic softies.", body: "Affection 88 · Chaos 94 · Curiosity 73", className: "sunset" },
  ];
  return <section className="shell section mc-story-preview">
    <div className="mc-section-heading"><span className="mc-eyebrow dark"><i /> Memory Cinema</span><h2>Not a dashboard.<br/><em>A reveal sequence.</em></h2><p>ThreadTales turns deterministic patterns into chapters with pacing, privacy labels and social-native visual direction.</p></div>
    <div className="mc-sample-grid">{chapters.map((chapter) => <article className={`mc-sample-chapter ${chapter.className}`} key={chapter.eyebrow}><small>{chapter.eyebrow}</small><h3>{chapter.title}</h3><p>{chapter.body}</p><span className="mc-safe-badge">Share-safe derived fact</span></article>)}</div>
  </section>;
}

export function HowItFeelsSection() {
  return <section id="how" className="shell section mc-how">
    <div className="mc-section-heading"><span className="mc-eyebrow dark"><i /> The experience</span><h2>Three minutes.<br/>A memory capsule opens.</h2><p>The interface reveals the relationship gradually instead of dumping statistics all at once.</p></div>
    <ProductFlowStepper />
  </section>;
}
