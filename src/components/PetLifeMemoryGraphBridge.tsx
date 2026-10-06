"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  PETLIFE_SHARED_MEMORY_SPACE_ID,
  clearPetLifeMemoryGraph,
  syncPetLifeMemoryGraph,
} from "@/lib/petlife-memory-adapter";
import { memorySpaceHomeHref } from "@/lib/memory-platform";
import type { PetMemory, PetProfile } from "@/products/petlife/model";

const PETLIFE_LOCAL_KEY = "story-platform:petlife:v1";

type PetLifeState = { profile: PetProfile | null; memories: PetMemory[] };

function readPetLifeState(): PetLifeState | null {
  try {
    const raw = window.localStorage.getItem(PETLIFE_LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PetLifeState>;
    if (!parsed.profile?.id || !Array.isArray(parsed.memories)) return null;
    return { profile: parsed.profile, memories: parsed.memories };
  } catch {
    return null;
  }
}

export function PetLifeMemoryGraphBridge() {
  const [petName, setPetName] = useState("");
  const [memoryCount, setMemoryCount] = useState(0);

  useEffect(() => {
    let lastSnapshot = "";
    const sync = () => {
      const state = readPetLifeState();
      if (!state) {
        if (lastSnapshot) clearPetLifeMemoryGraph();
        lastSnapshot = "";
        setPetName("");
        setMemoryCount(0);
        return;
      }
      const snapshot = JSON.stringify({ profile: state.profile, memories: state.memories });
      if (snapshot === lastSnapshot) return;
      lastSnapshot = snapshot;
      syncPetLifeMemoryGraph(state.profile, state.memories);
      setPetName(state.profile.name);
      setMemoryCount(state.memories.length);
    };

    sync();
    const timer = window.setInterval(sync, 750);
    return () => window.clearInterval(timer);
  }, []);

  if (!petName) return null;

  return (
    <div className="notice" data-petlife-graph-bridge>
      {petName}&apos;s {memoryCount} saved timeline memor{memoryCount === 1 ? "y is" : "ies are"} mirrored into the shared Memory Graph. Session-only photo bytes stay out of the graph.{" "}
      <Link href={memorySpaceHomeHref(PETLIFE_SHARED_MEMORY_SPACE_ID)}>Open shared MemorySpace →</Link>
    </div>
  );
}
