import Link from "next/link";
import { Suspense } from "react";
import { MemoryIntakeClient } from "@/components/MemoryIntakeClient";

export default async function MemoryIntakePage({
  params,
}: {
  params: Promise<{ source: string }>;
}) {
  const { source } = await params;
  if (source !== "manual" && source !== "photos-videos") {
    return (
      <main style={{ minHeight: "100vh", background: "#0f0f12", color: "#f7f3ee", padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ color: "#ffbd98", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700, fontSize: 12 }}>ThreadTales Memory Keeper</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1, letterSpacing: "-.055em", margin: "12px 0 22px" }}>That memory source is not available.</h1>
          <Link href="/memory/new" style={{ color: "inherit" }}>Return to memory creation</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mc-product-page">
      <section className="shell hero mc-product-hero">
        <span className="mc-eyebrow dark"><i /> Memory Keeper intake</span>
        <h1>{source === "manual" ? "Start with a memory." : "Start with photos & videos."}</h1>
        <p>{source === "manual" ? "Write the moment in your own words and keep it directly in the shared Memory Graph." : "Choose local media, review the metadata, and decide what belongs in this MemorySpace."}</p>
      </section>
      <section className="shell section" style={{ paddingTop: 20 }}>
        <Suspense fallback={<div className="notice">Opening your local MemorySpace…</div>}>
          <MemoryIntakeClient source={source} />
        </Suspense>
      </section>
    </main>
  );
}
