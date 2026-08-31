"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { toThreadTaleResultV2 } from "@/platform/threadtales/result-v2";
import { getStoryModeConfig } from "@/platform/story/modes";

export function CloudSavePanel({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const [status, setStatus] = useState<"checking" | "disabled" | "signed-out" | "signed-in">("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const result = useMemo(() => toThreadTaleResultV2(stats), [stats]);
  const config = getStoryModeConfig(mode);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/stories", { cache: "no-store" }).then((response) => {
      if (cancelled) return;
      if (response.status === 503) setStatus("disabled");
      else if (response.status === 401) setStatus("signed-out");
      else if (response.ok) setStatus("signed-in");
      else setStatus("signed-out");
    }).catch(() => { if (!cancelled) setStatus("disabled"); });
    return () => { cancelled = true; };
  }, []);

  async function requestMagicLink() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/magic-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await response.json() as { sent?: boolean; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send a sign-in link.");
      setMessage("Check your email for a private sign-in link. Your chat is not sent with this request.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not send a sign-in link.");
    } finally {
      setBusy(false);
    }
  }

  async function saveStory() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "threadtales", mode, title: config.eyebrow, result }),
      });
      const data = await response.json() as { story?: { id?: string }; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save this story.");
      setMessage("Saved. Only the derived result was stored—never the imported chat text.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save this story.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "disabled") return <section className="story cloud-panel"><span className="story-summary-kicker">Optional cloud save</span><h3>Local mode is active.</h3><p>Accounts and saved derived stories stay disabled until Supabase is configured. The anonymous analyzer does not depend on it.</p></section>;

  return <section className="story cloud-panel">
    <span className="story-summary-kicker">Optional cloud save</span>
    <h3>{status === "signed-in" ? "Save this derived story" : "Save it for later"}</h3>
    <p>Cloud save is opt-in and stores the versioned derived result only. It never stores the imported WhatsApp text.</p>
    {status === "signed-out" ? <div className="cloud-auth"><input className="share-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email for magic link"/><button className="btn btn-soft" disabled={busy || !email} onClick={() => void requestMagicLink()}>{busy ? "Sending…" : "Email me a sign-in link"}</button></div> : null}
    {status === "signed-in" ? <div className="premium-actions"><button className="btn btn-soft" disabled={busy} onClick={() => void saveStory()}>{busy ? "Saving…" : "Save derived story"}</button><a className="btn btn-soft" href="/account">My saved stories</a></div> : null}
    {message ? <div className="notice" role="status">{message}</div> : null}
  </section>;
}
