"use client";

import { useState } from "react";

const plans = [
  ["plus", "Plus", "Cloud worlds, private albums, premium themes"],
  ["family", "Family", "Shared family spaces and more storage"],
  ["creator", "Creator", "CreatorWorld limits and larger media"],
  ["business", "Business", "FounderWorld and team-oriented limits"],
] as const;

export function BillingClient({ currentPlan }: { currentPlan: string }) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [message, setMessage] = useState("");

  async function checkout(plan: string) {
    setMessage("Opening secure Stripe Checkout…");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, interval }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Billing is not configured yet.");
      return;
    }

    window.location.assign(data.checkoutUrl);
  }

  async function portal() {
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Billing portal is unavailable.");
      return;
    }

    window.location.assign(data.portalUrl);
  }

  return (
    <div>
      <div className="billing-toggle">
        <button
          aria-pressed={interval === "month"}
          onClick={() => setInterval("month")}
        >
          Monthly
        </button>
        <button
          aria-pressed={interval === "year"}
          onClick={() => setInterval("year")}
        >
          Annual
        </button>
      </div>

      <div className="plan-grid">
        {plans.map(([slug, label, copy]) => (
          <article
            className={currentPlan === slug ? "plan-card current" : "plan-card"}
            key={slug}
          >
            <span className="story-summary-kicker">
              {currentPlan === slug ? "Current plan" : "Story Platform"}
            </span>
            <h2>{label}</h2>
            <p>{copy}</p>
            <button
              className="btn btn-primary"
              disabled={currentPlan === slug}
              onClick={() => checkout(slug)}
            >
              {currentPlan === slug ? "Current" : `Choose ${label}`}
            </button>
          </article>
        ))}
      </div>

      <button className="btn btn-soft" onClick={portal}>
        Manage billing in Stripe
      </button>
      {message ? (
        <p role="status" className="notice">
          {message}
        </p>
      ) : null}
    </div>
  );
}
