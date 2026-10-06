"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isMemoryIntentKind, type MemoryIntentKind } from "@/lib/memory-space";
import { isMemoryGraph, memoryGraphStorageKey, type MemoryGraph } from "@/lib/memory-graph";
import { composeMemoryStory, storyPlanStorageKey, type MemoryStoryPlan } from "@/lib/memory-story";
import styles from "./page.module.css";

interface StoryState {
  graph: MemoryGraph | null;
  plan: MemoryStoryPlan | null;
  error: string;
}

function loadStory(memorySpaceId: string, intent: MemoryIntentKind): StoryState {
  try {
    const raw = window.localStorage.getItem(memoryGraphStorageKey(memorySpaceId));
    if (!raw) return { graph: null, plan: null, error: "No approved memories are saved in this MemorySpace yet." };
    const parsed: unknown = JSON.parse(raw);
    if (!isMemoryGraph(parsed) || parsed.memorySpaceId !== memorySpaceId) {
      return { graph: null, plan: null, error: "The local Memory Graph could not be read safely." };
    }
    if (parsed.nodes.length === 0) {
      return { graph: parsed, plan: null, error: "Keep at least one memory before building the story." };
    }
    const plan = composeMemoryStory(parsed, intent);
    window.localStorage.setItem(storyPlanStorageKey(memorySpaceId, intent), JSON.stringify(plan));
    return { graph: parsed, plan, error: "" };
  } catch {
    return { graph: null, plan: null, error: "The local Memory Graph could not be read safely." };
  }
}

export default function MemoryStoryPage() {
  const search = useSearchParams();
  const memorySpaceId = search.get("memorySpaceId")?.trim() ?? "";
  const requestedIntent = search.get("intent");
  const intent: MemoryIntentKind = isMemoryIntentKind(requestedIntent) ? requestedIntent : "MEMORY_LANE";
  const [state, setState] = useState<StoryState>({ graph: null, plan: null, error: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const result = memorySpaceId
      ? loadStory(memorySpaceId, intent)
      : { graph: null, plan: null, error: "This story preview needs a MemorySpace." };
    const timer = window.setTimeout(() => {
      setState(result);
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [memorySpaceId, intent]);

  const privateCount = useMemo(
    () => state.graph?.nodes.filter((node) => node.containsPrivateText).length ?? 0,
    [state.graph],
  );

  if (!loaded) {
    return <main className={styles.page}><div className={styles.loading}>Building the story from approved memories…</div></main>;
  }

  if (!state.plan) {
    return (
      <main className={styles.page}>
        <section className={styles.empty}>
          <p className={styles.eyebrow}>Memory Story</p>
          <h1>There isn’t enough approved memory yet.</h1>
          <p>{state.error}</p>
          <Link className={styles.primary} href="/memory/new">Return to MemorySpace</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">ThreadTales</Link>
        <span>Story plan · local preview</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>Intent composer</p>
        <h1>{state.plan.title}</h1>
        <p>{state.plan.subtitle}</p>
        <div className={styles.receipts}>
          <span>{state.graph?.nodes.length ?? 0} approved memories</span>
          <span>{state.plan.beats.length} story beats</span>
          <span>{privateCount} private-text memories</span>
        </div>
      </section>

      <section className={styles.timeline} aria-label={`${state.plan.title} story beats`}>
        {state.plan.beats.map((beat, index) => (
          <article className={styles.beat} key={beat.id} data-source={beat.source}>
            <div className={styles.number}>{String(index + 1).padStart(2, "0")}</div>
            <div>
              <div className={styles.meta}>
                <span>{beat.kind.toLowerCase()}</span>
                <span>{beat.source === "MEMORY_NODE" ? "approved memory" : beat.source === "USER_REQUIRED" ? "your words required" : "intent structure"}</span>
              </div>
              <h2>{beat.title}</h2>
              {beat.body ? <p>{beat.body}</p> : null}
              {beat.source === "USER_REQUIRED" ? (
                <div className={styles.userRequired}>ThreadTales leaves this beat unwritten on purpose.</div>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.next}>
        <div>
          <p className={styles.eyebrow}>What this proves</p>
          <h2>The same memories now tell a different story for this intent.</h2>
          <p>This is still a deterministic plan. Photos, video, soundtrack, editing, and final rendering come in the next studio slice.</p>
        </div>
        <Link className={styles.secondary} href="/memory/new">Create another MemorySpace</Link>
      </section>
    </main>
  );
}
