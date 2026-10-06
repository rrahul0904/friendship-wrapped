"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MEMORY_SPACE_INDEX_KEY,
  createMemorySpaceManifest,
  memorySpaceStorageKey,
} from "@/lib/memory-platform";
import {
  MEMORY_DRAFT_STORAGE_KEY,
  MEMORY_INTENTS,
  RELATIONSHIPS,
  draftForProductSlug,
  isMemorySpaceDraft,
  newMemorySpaceDraft,
  recommendedIntents,
  sourceIntakeHref,
  type MemoryIntentKind,
  type MemorySourceKind,
  type MemorySpaceDraft,
  type RelationshipType,
} from "@/lib/memory-space";
import styles from "./page.module.css";

const SOURCES: Array<{ kind: MemorySourceKind; label: string; description: string }> = [
  {
    kind: "CONVERSATION",
    label: "Conversation",
    description: "Start with a WhatsApp or Telegram conversation. Raw messages stay on this device by default.",
  },
  {
    kind: "PHOTOS_VIDEOS",
    label: "Photos & videos",
    description: "Start from the moments you already have in your camera roll or files.",
  },
  {
    kind: "MANUAL",
    label: "Start manually",
    description: "Begin with a memory, milestone, note, place, or story in your own words.",
  },
];

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function freshDraft() {
  return newMemorySpaceDraft(createId());
}

function indexMemorySpace(memorySpaceId: string) {
  try {
    const raw = window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    if (!ids.includes(memorySpaceId)) window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify([...ids, memorySpaceId]));
  } catch {
    window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify([memorySpaceId]));
  }
}

export default function NewMemoryPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [draft, setDraft] = useState<MemorySpaceDraft>(() => freshDraft());
  const [hydrated, setHydrated] = useState(false);
  const [showAllIntents, setShowAllIntents] = useState(false);

  useEffect(() => {
    const requestedTemplate = search.get("template");
    let restored: MemorySpaceDraft | null = null;
    try {
      if (requestedTemplate) {
        restored = draftForProductSlug(createId(), requestedTemplate);
      } else {
        const stored = window.localStorage.getItem(MEMORY_DRAFT_STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isMemorySpaceDraft(parsed)) restored = parsed;
        }
      }
    } catch {
      window.localStorage.removeItem(MEMORY_DRAFT_STORAGE_KEY);
    }

    const timer = window.setTimeout(() => {
      if (restored) setDraft(restored);
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      MEMORY_DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }),
    );
  }, [draft, hydrated]);

  const recommended = useMemo(
    () => (draft.relationshipType ? recommendedIntents(draft.relationshipType) : []),
    [draft.relationshipType],
  );

  const recommendedKinds = useMemo(
    () => new Set(recommended.map((intent) => intent.kind)),
    [recommended],
  );

  const additionalIntents = useMemo(
    () => MEMORY_INTENTS.filter((intent) => !recommendedKinds.has(intent.kind)),
    [recommendedKinds],
  );

  const availableSources = useMemo(
    () => draft.relationshipType === "PET" || draft.relationshipType === "HOME"
      ? SOURCES.filter((source) => source.kind !== "CONVERSATION")
      : SOURCES,
    [draft.relationshipType],
  );

  function chooseRelationship(relationshipType: RelationshipType) {
    setDraft((current) => ({
      ...current,
      relationshipType,
      productTemplate: null,
      intent: null,
      step: "INTENT",
    }));
    setShowAllIntents(false);
  }

  function chooseIntent(intent: MemoryIntentKind) {
    setDraft((current) => ({ ...current, intent, step: "NAME" }));
  }

  function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    setDraft((current) => ({ ...current, name: current.name.trim(), step: "SOURCE" }));
  }

  function chooseSource(source: MemorySourceKind) {
    if (!draft.relationshipType) return;
    const completed: MemorySpaceDraft = { ...draft, source, step: "SOURCE", updatedAt: new Date().toISOString() };
    const href = sourceIntakeHref(completed);
    if (!href) return;

    const manifest = createMemorySpaceManifest({
      id: completed.id,
      name: completed.name,
      relationshipType: completed.relationshipType,
      productTemplate: completed.productTemplate ?? undefined,
    });

    setDraft(completed);
    window.localStorage.setItem(MEMORY_DRAFT_STORAGE_KEY, JSON.stringify(completed));
    window.localStorage.setItem(memorySpaceStorageKey(completed.id), JSON.stringify(manifest));
    indexMemorySpace(completed.id);
    router.push(href);
  }

  function goBack() {
    setDraft((current) => {
      if (current.step === "SOURCE") return { ...current, step: "NAME" };
      if (current.step === "NAME") return { ...current, step: "INTENT" };
      if (current.step === "INTENT") return { ...current, step: "RELATIONSHIP" };
      return current;
    });
  }

  function restart() {
    const next = freshDraft();
    setDraft(next);
    setShowAllIntents(false);
    window.localStorage.setItem(MEMORY_DRAFT_STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <main className={styles.page}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/">ThreadTales</Link>
        <button className={styles.restart} type="button" onClick={restart}>Start over</button>
      </header>

      <section className={styles.shell}>
        <div className={styles.progress} aria-label="Creation progress">
          {["RELATIONSHIP", "INTENT", "NAME", "SOURCE"].map((step, index) => {
            const order = ["RELATIONSHIP", "INTENT", "NAME", "SOURCE"];
            const activeIndex = order.indexOf(draft.step);
            return <span key={step} className={index <= activeIndex ? styles.progressActive : undefined} />;
          })}
        </div>

        {draft.step !== "RELATIONSHIP" && (
          <button className={styles.back} type="button" onClick={goBack}>← Back</button>
        )}

        {draft.step === "RELATIONSHIP" && (
          <div className={styles.stage}>
            <p className={styles.eyebrow}>Create a memory home</p>
            <h1>Who or what is this for?</h1>
            <p className={styles.lede}>Start with the subject. The same MemorySpace can keep growing for years while ThreadTales creates different stories from it.</p>
            <div className={styles.grid}>
              {RELATIONSHIPS.map((relationship) => (
                <button
                  key={relationship.kind}
                  type="button"
                  className={styles.choice}
                  onClick={() => chooseRelationship(relationship.kind)}
                >
                  <strong>{relationship.label}</strong>
                  <span>{relationship.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {draft.step === "INTENT" && draft.relationshipType && (
          <div className={styles.stage}>
            <p className={styles.eyebrow}>{draft.productTemplate ? `${draft.productTemplate.toLowerCase()} · ` : ""}Make something meaningful</p>
            <h1>What are you trying to create?</h1>
            <p className={styles.lede}>The memories stay reusable. The intent changes how ThreadTales composes them for this moment.</p>
            <div className={styles.grid}>
              {recommended.map((intent) => (
                <button
                  key={intent.kind}
                  type="button"
                  className={styles.choice}
                  onClick={() => chooseIntent(intent.kind)}
                >
                  <span className={styles.badge}>Suggested</span>
                  <strong>{intent.label}</strong>
                  <span>{intent.description}</span>
                </button>
              ))}
            </div>
            {additionalIntents.length > 0 && (
              <div className={styles.moreWrap}>
                <button className={styles.moreButton} type="button" onClick={() => setShowAllIntents((value) => !value)}>
                  {showAllIntents ? "Hide other ideas" : "Show other ideas"}
                </button>
                {showAllIntents && (
                  <div className={styles.grid}>
                    {additionalIntents.map((intent) => (
                      <button
                        key={intent.kind}
                        type="button"
                        className={styles.choice}
                        onClick={() => chooseIntent(intent.kind)}
                      >
                        <strong>{intent.label}</strong>
                        <span>{intent.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {draft.step === "NAME" && (
          <div className={`${styles.stage} ${styles.narrow}`}>
            <p className={styles.eyebrow}>Give this memory home a name</p>
            <h1>What should we call it?</h1>
            <p className={styles.lede}>A name you will recognize years from now — a person, family, pet, home, group, or chapter of your own life.</p>
            <form onSubmit={submitName} className={styles.form}>
              <label htmlFor="memory-name">MemorySpace name</label>
              <input
                id="memory-name"
                autoFocus
                maxLength={80}
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Anjali · My daughter · Bruno · Our home · College crew"
              />
              <button className={styles.primary} disabled={!draft.name.trim()} type="submit">Continue</button>
            </form>
          </div>
        )}

        {draft.step === "SOURCE" && (
          <div className={styles.stage}>
            <p className={styles.eyebrow}>{draft.name || "Your memory"}</p>
            <h1>Where should we start?</h1>
            <p className={styles.lede}>You can add more sources later. Pick the easiest place to begin today.</p>
            <div className={styles.sourceGrid}>
              {availableSources.map((source) => (
                <button
                  key={source.kind}
                  type="button"
                  className={styles.sourceChoice}
                  onClick={() => chooseSource(source.kind)}
                >
                  <strong>{source.label}</strong>
                  <span>{source.description}</span>
                </button>
              ))}
            </div>
            <p className={styles.privacy}>The MemorySpace manifest is stored locally first. Raw conversation and selected media bytes are not uploaded by this creation flow.</p>
          </div>
        )}
      </section>
    </main>
  );
}
