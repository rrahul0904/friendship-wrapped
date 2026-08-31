"use client";

import { useEffect, useState } from "react";
import { trackProductEvent } from "@/platform/telemetry/client";

export interface ProductCloudSavePanelProps {
  product: "threadtales" | "myyear" | "petlife";
  title: string;
  result: unknown;
  mode?: string;
  description?: string;
}

export function ProductCloudSavePanel({ product, title, result, mode, description }: ProductCloudSavePanelProps) {
  const [status, setStatus] = useState<"checking" | "disabled" | "signed-out" | "signed-in">("checking");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/stories", { cache: "no-store" })
      .then((response) => {
        if (cancelled) return;
        if (response.status === 503) setStatus("disabled");
        else if (response.status === 401) setStatus("signed-out");
        else if (response.ok) setStatus("signed-in");
        else setStatus("signed-out");
      })
      .catch(() => { if (!cancelled) setStatus("disabled"); });
    return () => { cancelled = true; };
  }, []);

  async function requestMagicLink() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not send a sign-in link.");
      setMessage("Check your email for a private sign-in link. The story payload is not included in the email request.");
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
        body: JSON.stringify({ product, mode, title, result }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save this story.");
      trackProductEvent("story_saved", product, mode);
      setMessage("Saved privately. This cloud action stores only the explicit derived story payload.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not save this story.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "disabled") return <section className="story cloud-panel"><span className="story-summary-kicker">Optional cloud save</span><h3>Local mode is active.</h3><p>Accounts and saved stories stay disabled until a dedicated Supabase project is configured. The local product does not depend on it.</p></section>;

  return <section className="story cloud-panel">
    <span className="story-summary-kicker">Optional cloud save</span>
    <h3>{status === "signed-in" ? "Save this story privately" : "Save it for later"}</h3>
    <p>{description ?? "Cloud save is opt-in and stores only the derived story representation shown by this product."}</p>
    {status === "signed-out" ? <div className="cloud-auth"><input className="share-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email for magic link"/><button className="btn btn-soft" disabled={busy || !email} onClick={() => void requestMagicLink()}>{busy ? "Sending…" : "Email me a sign-in link"}</button></div> : null}
    {status === "signed-in" ? <div className="premium-actions"><button className="btn btn-soft" disabled={busy} onClick={() => void saveStory()}>{busy ? "Saving…" : "Save story"}</button><a className="btn btn-soft" href="/account">My saved stories</a></div> : null}
    {message ? <div className="notice" role="status">{message}</div> : null}
  </section>;
}
