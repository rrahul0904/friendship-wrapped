"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PublicStory } from "@/components/WrappedStory";
import { decodeSnapshot } from "@/lib/share";
import type { PublicSnapshot } from "@/lib/types";
import { trackProductEvent } from "@/platform/telemetry/client";

export default function SharePage() {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const decoded = decodeSnapshot(window.location.hash.slice(1));
      setSnapshot(decoded);
      if (decoded) trackProductEvent("share_opened", "threadtales", decoded.mode);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <>
    <Header />
    <main className="shell results">
      {snapshot === undefined ? (
        <div className="empty-share"><p>Opening this ThreadTale…</p></div>
      ) : snapshot ? (
        <>
          <PublicStory snapshot={snapshot} />
          <div className="story share-panel"><h3>Make your own</h3><p>This public page contains derived statistics only. The original chat was never uploaded to ThreadTales.</p><Link className="btn btn-primary" href="/create" onClick={() => trackProductEvent("make_yours_clicked", "threadtales", snapshot.mode)}>Create my ThreadTale →</Link></div>
        </>
      ) : (
        <div className="empty-share"><h1>This tale is missing.</h1><p>The share payload is absent or invalid. ThreadTales doesn’t keep a central copy, so the complete link matters.</p><Link className="btn btn-primary" href="/create">Make a new one</Link></div>
      )}
    </main>
    <Footer />
  </>;
}
