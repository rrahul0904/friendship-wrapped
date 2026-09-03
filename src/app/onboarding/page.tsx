"use client";

import { useState } from "react";
import Link from "next/link";

const options = ["Friendships", "My year", "Relationship", "Pets", "Baby / family", "Travel / life", "Home", "Family history", "Startup", "Creator journey"];

export default function OnboardingPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function finish() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interests: selected, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, locale: navigator.language, onboardingCompleted: true }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save onboarding.");
      window.location.assign("/app");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not save onboarding."); }
    finally { setLoading(false); }
  }
  return <main className="saas-onboarding"><section><span className="saas-kicker">WELCOME TO YOUR MEMORY OS</span><h1>What do you want to preserve?</h1><p>This only personalizes your starting shelf. Every story product remains available.</p><div className="saas-interest-grid">{options.map((option) => <button key={option} type="button" className={selected.includes(option) ? "selected" : ""} onClick={() => setSelected((current) => current.includes(option) ? current.filter((item) => item !== option) : [...current, option])}>{option}</button>)}</div><div className="premium-actions"><button className="btn btn-primary" onClick={finish} disabled={loading}>{loading ? "Saving…" : "Enter my story space"}</button><Link className="btn btn-soft" href="/app">Skip for now</Link></div>{message ? <div className="notice" role="status">{message}</div> : null}</section></main>;
}
