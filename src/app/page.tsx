import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return <>
    <Header />
    <main>
      <section className="shell hero">
        <span className="kicker">🔒 Private by default · zero upload</span>
        <h1>Your chats, turned into a <span className="gradient-text">story worth sharing.</span></h1>
        <p>Drop in a chat export and discover the years, streaks, late-night chaos, favorite words, and tiny patterns that make your friendship yours.</p>
        <div className="hero-actions"><Link className="btn btn-primary" href="/create">Create my ThreadTale →</Link><Link className="btn btn-soft" href="/create?demo=1">Try the demo</Link></div>
        <div className="trust">No account. No database. Your raw messages never leave your browser.</div>
        <div className="demo-stack" aria-hidden="true">
          <div className="demo-card demo-left"><div className="metric-label">Longest streak</div><div className="metric-big">38</div><div className="story-sub">days without shutting up</div></div>
          <div className="demo-card demo-main">
            <div className="metric-label">Maya + Jordan</div><div className="metric-big">12,482</div><div className="story-sub">messages across 642 days</div>
            <div className="metric-row"><div className="mini"><strong>1:14am</strong><span>peak chaos hour</span></div><div className="mini"><strong>54/46</strong><span>message split</span></div><div className="mini"><strong>1,204</strong><span>laugh signals</span></div></div>
          </div>
          <div className="demo-card demo-right"><div className="metric-label">Friendship vibe</div><div className="metric-big">94</div><div className="story-sub">certified chaotic good</div></div>
        </div>
      </section>
      <section id="how" className="shell section">
        <h2>Three minutes. One surprisingly emotional page.</h2>
        <p className="section-copy">The first version is deliberately simple: export your chat, analyze it locally, and choose what you want to turn into a shareable story.</p>
        <div className="grid3">
          <div className="feature"><div className="feature-icon">📥</div><h3>1. Export your chat</h3><p>Upload the text export from WhatsApp. Multiline messages and common iOS/Android formats are supported.</p></div>
          <div className="feature"><div className="feature-icon">✨</div><h3>2. See your patterns</h3><p>Messages, years, streaks, peak hours, balance, questions, laughter, hearts, top words and more.</p></div>
          <div className="feature"><div className="feature-icon">💌</div><h3>3. Share the good parts</h3><p>Create a tiny privacy-safe share link containing only derived stats you approve—not your chat history.</p></div>
        </div>
      </section>
      <section className="shell section">
        <div className="privacy-banner"><div><h2>Your group chat is not our training data.</h2><p>In V1, parsing and analytics happen entirely in your browser. We do not need an account, a file bucket, or a database to generate your story. That is cheaper for us and safer for you.</p><Link className="btn btn-soft" href="/privacy">Read the privacy model</Link></div><div className="code-pill">raw_chat.txt → browser memory → derived stats → optional share payload<br/><br/>server upload: NONE<br/>database write: NONE<br/>AI call: NONE</div></div>
      </section>
    </main>
    <Footer />
  </>;
}
