"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackProductEvent } from "@/platform/telemetry/client";
import { premiumEntitlementStorageKey } from "./PremiumPanel";

export function PremiumRecovery({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<"checking" | "ready" | "error">("checking");
  const [message, setMessage] = useState("Verifying your purchase with Stripe…");

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/entitlements?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { token?: string; error?: string };
        if (!response.ok || !data.token) throw new Error(data.error ?? "Could not verify this purchase.");
        if (cancelled) return;
        window.localStorage.setItem(premiumEntitlementStorageKey, data.token);
        trackProductEvent("purchase_verified", "threadtales");
        setState("ready");
        setMessage("Premium is unlocked on this browser. Your chat content was not involved in payment verification.");
      })
      .catch((cause) => {
        if (cancelled) return;
        setState("error");
        setMessage(cause instanceof Error ? cause.message : "Could not verify this purchase.");
      });
    return () => { cancelled = true; };
  }, [sessionId]);

  return <div className="premium-recovery"><span className="kicker">Secure entitlement recovery</span><h1>{state === "ready" ? "Premium unlocked." : state === "error" ? "We could not verify that purchase." : "Checking your purchase…"}</h1><p>{message}</p><div className="hero-actions">{state === "ready" ? <Link className="btn btn-primary" href="/create">Return to ThreadTales →</Link> : null}<Link className="btn btn-soft" href="/">Home</Link></div></div>;
}
