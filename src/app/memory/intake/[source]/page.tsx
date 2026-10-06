import Link from "next/link";

const SOURCE_COPY: Record<string, { title: string; description: string; next: string }> = {
  "photos-videos": {
    title: "Start with photos & videos",
    description: "This MemorySpace is ready for media intake without changing the underlying person, intent, or draft identity.",
    next: "Next slice: add local photo/video selection, timeline suggestions, and explicit approval before anything becomes a MemoryNode.",
  },
  manual: {
    title: "Start with a memory",
    description: "This MemorySpace is ready for a manual first memory — a milestone, place, note, date, or story in your own words.",
    next: "Next slice: add typed manual MemoryCandidate creation and approval into the Memory Graph.",
  },
};

export default async function MemoryIntakePage({
  params,
}: {
  params: Promise<{ source: string }>;
}) {
  const { source } = await params;
  const copy = SOURCE_COPY[source];

  if (!copy) {
    return (
      <main style={{ minHeight: "100vh", background: "#0f0f12", color: "#f7f3ee", padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ color: "#ffbd98", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700, fontSize: 12 }}>ThreadTales Memory Keeper</p>
          <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1, letterSpacing: "-.055em", margin: "12px 0 22px" }}>That memory source is not available yet.</h1>
          <Link href="/memory/new" style={{ color: "inherit" }}>Return to memory creation</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#0f0f12", color: "#f7f3ee", padding: "64px 24px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <p style={{ color: "#ffbd98", textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 700, fontSize: 12 }}>MemorySpace created locally</p>
        <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1, letterSpacing: "-.055em", margin: "12px 0 22px" }}>{copy.title}</h1>
        <p style={{ fontSize: 19, lineHeight: 1.65, color: "rgba(247,243,238,.72)" }}>{copy.description}</p>
        <div style={{ marginTop: 28, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", borderRadius: 20, padding: 22 }}>
          <strong style={{ display: "block", marginBottom: 8 }}>Implementation boundary</strong>
          <span style={{ color: "rgba(247,243,238,.62)", lineHeight: 1.55 }}>{copy.next}</span>
        </div>
        <p style={{ marginTop: 28, color: "rgba(247,243,238,.5)", lineHeight: 1.55 }}>No raw media or memory content is uploaded by this handoff page. The local MemorySpace draft remains in this browser.</p>
        <Link href="/memory/new" style={{ display: "inline-block", marginTop: 20, color: "inherit" }}>← Back to memory creation</Link>
      </div>
    </main>
  );
}
