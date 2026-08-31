"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublicStory } from "@/components/WrappedStory";
import { decodeSnapshot } from "@/lib/share";
import type { PublicSnapshot } from "@/lib/types";

export default function SharePage() {
  const [snapshot, setSnapshot] = useState<PublicSnapshot | null | undefined>(undefined);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSnapshot(decodeSnapshot(window.location.hash.slice(1)));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  return <><Header/><main className="shell results">{snapshot === undefined ? <div className="empty-share"><p>Opening this ThreadTale…</p></div> : snapshot ? <><PublicStory snapshot={snapshot}/><div className="story share-panel"><h3>Make your own</h3><p>This public page contains derived statistics only. The original chat was never uploaded to ThreadTales.</p><Link className="btn btn-primary" href="/create">Create my ThreadTale →</Link></div></> : <div className="empty-share"><h1>This tale is missing.</h1><p>The share payload is absent or invalid. ThreadTales doesn’t keep a central copy, so the complete link matters.</p><Link className="btn btn-primary" href="/create">Make a new one</Link></div>}</main><Footer/></>;
}
