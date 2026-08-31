"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChatStats, StoryMode } from "@/lib/types";
import { generatePremiumStory } from "@/products/friendship/premium-story";

const PREMIUM_PRODUCT = "friendship-premium-v1" as const;
const SESSION_KEY = "threadtales:premium-session-id";
const ANALYSIS_KEY = "threadtales:checkout-analysis";

interface StoredAnalysis {
  v: 1;
  stats: ChatStats;
  mode: StoryMode;
  savedAt: number;
}

interface VerifyResponse {
  entitled?: boolean;
}

interface CheckoutResponse {
  url?: string;
  error?: string;
}

function storeAnalysis(stats: ChatStats, mode: StoryMode) {
  const value: StoredAnalysis = { v: 1, stats, mode, savedAt: Date.now() };
  sessionStorage.setItem(ANALYSIS_KEY, JSON.stringify(value));
}

function cleanCheckoutParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("checkout");
  url.searchParams.delete("session_id");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function PremiumStory({ stats, mode }: { stats: ChatStats; mode: StoryMode }) {
  const story = useMemo(() => generatePremiumStory(stats, mode), [stats, mode]);
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [error, setError] = useState("");
  const priceLabel = process.env.NEXT_PUBLIC_PREMIUM_PRICE_LABEL ?? "$9.99";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const returnedSession = params.get("session_id");
    if (returnedSession) sessionStorage.setItem(SESSION_KEY, returnedSession);
    const sessionId = returnedSession ?? sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) return;

    let active = true;
    queueMicrotask(() => { if (active) setVerifying(true); });
    fetch(`/api/entitlements/verify?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as VerifyResponse;
        if (!active) return;
        setUnlocked(response.ok && body.entitled === true);
        if (response.ok && body.entitled === true && returnedSession) cleanCheckoutParams();
      })
      .catch(() => {
        if (active) setError("We could not verify your purchase right now. Your payment is not lost; try again from this browser.");
      })
      .finally(() => {
        if (active) setVerifying(false);
      });

    return () => { active = false; };
  }, []);

  async function startCheckout() {
    setError("");
    setCheckoutBusy(true);
    storeAnalysis(stats, mode);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: PREMIUM_PRODUCT, returnPath: "/create" }),
      });
      const body = await response.json() as CheckoutResponse;
      if (!response.ok || !body.url) throw new Error(body.error ?? "Unable to start checkout.");
      window.location.assign(body.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start checkout.");
      setCheckoutBusy(false);
    }
  }

  return (
    <section className="story premium-story" aria-labelledby="premium-story-title">
      <div className="premium-heading">
        <div>
          <span className="story-summary-kicker">Premium story</span>
          <h3 id="premium-story-title">{story.title}</h3>
          <p>{story.subtitle}</p>
        </div>
        <div className="premium-offer">
          <strong>{priceLabel}</strong>
          <span>one-time</span>
        </div>
      </div>

      {verifying ? <div className="premium-status">Verifying your purchase…</div> : null}
      {unlocked ? <div className="premium-status success">✓ Premium story unlocked in this browser.</div> : null}

      <div className="premium-chapters">
        {story.chapters.map((item) => {
          const locked = item.lockedByDefault && !unlocked;
          return (
            <article className={`premium-chapter ${locked ? "locked" : ""}`} key={item.id}>
              <div className="premium-chapter-number">{String(item.ordinal).padStart(2, "0")}</div>
              <div className="premium-chapter-copy">
                <span>{item.kicker}</span>
                <h4>{item.title}</h4>
                {item.metric ? <strong>{item.metric}</strong> : null}
                {locked ? (
                  <p className="premium-locked-copy">Unlock to read this chapter.</p>
                ) : (
                  <p>{item.body}</p>
                )}
              </div>
              {locked ? <div className="premium-lock" aria-label="Premium chapter">✦</div> : null}
            </article>
          );
        })}
      </div>

      {!unlocked ? (
        <div className="premium-cta">
          <div>
            <strong>Unlock all 12 chapters</strong>
            <p>One payment. No subscription. The story is generated from derived statistics; your raw export remains in your browser.</p>
          </div>
          <button className="btn btn-primary" onClick={startCheckout} disabled={checkoutBusy || verifying}>
            {checkoutBusy ? "Opening secure checkout…" : `Unlock for ${priceLabel} →`}
          </button>
        </div>
      ) : null}

      {error ? <div className="error premium-error">{error}</div> : null}
    </section>
  );
}
