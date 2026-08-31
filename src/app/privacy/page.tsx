import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Privacy() {
  return <><Header/><main className="shell section">
    <span className="kicker">Privacy model · browser-local</span>
    <h2>The performance boundary moved to a Web Worker. Your chat did not move to a server.</h2>
    <p className="section-copy">ThreadTales reads your text export with browser File APIs. The file buffer is transferred to a browser Web Worker, where parsing and statistical analysis happen in local browser memory. The app does not send the raw file or message text to an API, database, object store, analytics pipeline, or AI model.</p>
    <div className="grid3">
      <div className="feature"><div className="feature-icon">🧠</div><h3>Off-thread, still local</h3><p>The Worker runs inside your browser process so large histories do not need to block the page&apos;s main UI thread.</p></div>
      <div className="feature"><div className="feature-icon">🔗</div><h3>Stat-only sharing</h3><p>Public links encode a compact snapshot of derived numbers. Participant names and top words remain opt-in because even aggregates can be personal.</p></div>
      <div className="feature"><div className="feature-icon">🗑️</div><h3>No chat-history store</h3><p>There is no central free-flow chat database. Completed, cancelled, failed, or superseded analysis workers are terminated.</p></div>
    </div>
    <div className="privacy-banner" style={{marginTop:34}}><div><h2>What leaves the Worker?</h2><p>Only the versioned derived ThreadTale result returns to the main page. Raw message bodies are not part of that result. If you create a public link, a separate derived-only public snapshot is encoded in the URL fragment.</p></div><div className="code-pill">raw_chat.txt → browser buffer<br/>→ browser Web Worker<br/>→ derived Result V2 → UI<br/><br/>server chat upload: NONE<br/>database write: NONE<br/>AI call: NONE</div></div>
  </main><Footer/></>;
}
