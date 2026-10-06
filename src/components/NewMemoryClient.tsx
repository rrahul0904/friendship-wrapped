"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MEMORY_SPACE_INDEX_KEY, createMemorySpaceManifest, memorySpaceStorageKey } from "@/lib/memory-platform";
import { MEMORY_DRAFT_STORAGE_KEY, MEMORY_INTENTS, RELATIONSHIPS, draftForProductSlug, isMemorySpaceDraft, newMemorySpaceDraft, recommendedIntents, sourceIntakeHref, type MemoryIntentKind, type MemorySourceKind, type MemorySpaceDraft, type RelationshipType } from "@/lib/memory-space";
import styles from "@/app/memory/new/page.module.css";

const SOURCES: Array<{ kind: MemorySourceKind; label: string; description: string }> = [
  { kind: "CONVERSATION", label: "Conversation", description: "Start with a WhatsApp or Telegram conversation. Raw messages stay on this device by default." },
  { kind: "PHOTOS_VIDEOS", label: "Photos & videos", description: "Start from the moments you already have in your camera roll or files." },
  { kind: "MANUAL", label: "Start manually", description: "Begin with a memory, milestone, note, place, or story in your own words." },
];

const createId = () => globalThis.crypto?.randomUUID?.() ?? `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const freshDraft = () => newMemorySpaceDraft(createId());

function indexMemorySpace(id: string) {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(MEMORY_SPACE_INDEX_KEY) ?? "[]");
    const ids = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify(ids.includes(id) ? ids : [...ids, id]));
  } catch { window.localStorage.setItem(MEMORY_SPACE_INDEX_KEY, JSON.stringify([id])); }
}

export function NewMemoryClient() {
  const router = useRouter();
  const search = useSearchParams();
  const [draft, setDraft] = useState<MemorySpaceDraft>(() => freshDraft());
  const [hydrated, setHydrated] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const template = search.get("template");
    let restored: MemorySpaceDraft | null = null;
    try {
      if (template) restored = draftForProductSlug(createId(), template);
      else {
        const raw = window.localStorage.getItem(MEMORY_DRAFT_STORAGE_KEY);
        if (raw) { const parsed: unknown = JSON.parse(raw); if (isMemorySpaceDraft(parsed)) restored = parsed; }
      }
    } catch { window.localStorage.removeItem(MEMORY_DRAFT_STORAGE_KEY); }
    const timer = window.setTimeout(() => { if (restored) setDraft(restored); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(MEMORY_DRAFT_STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  }, [draft, hydrated]);

  const recommended = useMemo(() => draft.relationshipType ? recommendedIntents(draft.relationshipType) : [], [draft.relationshipType]);
  const recommendedKinds = useMemo(() => new Set(recommended.map((item) => item.kind)), [recommended]);
  const extras = useMemo(() => MEMORY_INTENTS.filter((item) => !recommendedKinds.has(item.kind)), [recommendedKinds]);
  const sources = useMemo(() => draft.relationshipType === "PET" || draft.relationshipType === "HOME" ? SOURCES.filter((item) => item.kind !== "CONVERSATION") : SOURCES, [draft.relationshipType]);

  const chooseRelationship = (relationshipType: RelationshipType) => { setDraft((current) => ({ ...current, relationshipType, productTemplate: null, intent: null, step: "INTENT" })); setShowAll(false); };
  const chooseIntent = (intent: MemoryIntentKind) => setDraft((current) => ({ ...current, intent, step: "NAME" }));
  function submitName(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (draft.name.trim()) setDraft((current) => ({ ...current, name: current.name.trim(), step: "SOURCE" })); }
  function chooseSource(source: MemorySourceKind) {
    const relationshipType = draft.relationshipType;
    if (!relationshipType) return;
    const completed: MemorySpaceDraft = { ...draft, relationshipType, source, step: "SOURCE", updatedAt: new Date().toISOString() };
    const href = sourceIntakeHref(completed);
    if (!href) return;
    const manifest = createMemorySpaceManifest({ id: completed.id, name: completed.name, relationshipType, productTemplate: completed.productTemplate ?? undefined });
    setDraft(completed);
    window.localStorage.setItem(MEMORY_DRAFT_STORAGE_KEY, JSON.stringify(completed));
    window.localStorage.setItem(memorySpaceStorageKey(completed.id), JSON.stringify(manifest));
    indexMemorySpace(completed.id);
    router.push(href);
  }
  const goBack = () => setDraft((current) => current.step === "SOURCE" ? { ...current, step: "NAME" } : current.step === "NAME" ? { ...current, step: "INTENT" } : current.step === "INTENT" ? { ...current, step: "RELATIONSHIP" } : current);
  function restart() { const next = freshDraft(); setDraft(next); setShowAll(false); window.localStorage.setItem(MEMORY_DRAFT_STORAGE_KEY, JSON.stringify(next)); }

  return <main className={styles.page}>
    <div className={styles.ambient} aria-hidden="true" />
    <header className={styles.topbar}><Link className={styles.brand} href="/">ThreadTales</Link><button className={styles.restart} type="button" onClick={restart}>Start over</button></header>
    <section className={styles.shell}>
      <div className={styles.progress} aria-label="Creation progress">{["RELATIONSHIP","INTENT","NAME","SOURCE"].map((step,index) => { const order=["RELATIONSHIP","INTENT","NAME","SOURCE"]; return <span key={step} className={index <= order.indexOf(draft.step) ? styles.progressActive : undefined}/>; })}</div>
      {draft.step !== "RELATIONSHIP" ? <button className={styles.back} type="button" onClick={goBack}>← Back</button> : null}
      {draft.step === "RELATIONSHIP" ? <div className={styles.stage}><p className={styles.eyebrow}>Create a memory home</p><h1>Who or what is this for?</h1><p className={styles.lede}>Start with the subject. The same MemorySpace can keep growing for years while ThreadTales creates different stories from it.</p><div className={styles.grid}>{RELATIONSHIPS.map((item) => <button key={item.kind} type="button" className={styles.choice} onClick={() => chooseRelationship(item.kind)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div></div> : null}
      {draft.step === "INTENT" && draft.relationshipType ? <div className={styles.stage}><p className={styles.eyebrow}>{draft.productTemplate ? `${draft.productTemplate.toLowerCase()} · ` : ""}Make something meaningful</p><h1>What are you trying to create?</h1><p className={styles.lede}>The memories stay reusable. The intent changes how ThreadTales composes them for this moment.</p><div className={styles.grid}>{recommended.map((item) => <button key={item.kind} type="button" className={styles.choice} onClick={() => chooseIntent(item.kind)}><span className={styles.badge}>Suggested</span><strong>{item.label}</strong><span>{item.description}</span></button>)}</div>{extras.length ? <div className={styles.moreWrap}><button className={styles.moreButton} type="button" onClick={() => setShowAll((v) => !v)}>{showAll ? "Hide other ideas" : "Show other ideas"}</button>{showAll ? <div className={styles.grid}>{extras.map((item) => <button key={item.kind} type="button" className={styles.choice} onClick={() => chooseIntent(item.kind)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div> : null}</div> : null}</div> : null}
      {draft.step === "NAME" ? <div className={`${styles.stage} ${styles.narrow}`}><p className={styles.eyebrow}>Give this memory home a name</p><h1>What should we call it?</h1><p className={styles.lede}>A name you will recognize years from now — a person, family, pet, home, group, or chapter of your own life.</p><form onSubmit={submitName} className={styles.form}><label htmlFor="memory-name">MemorySpace name</label><input id="memory-name" autoFocus maxLength={80} value={draft.name} onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))} placeholder="Anjali · My daughter · Bruno · Our home · College crew"/><button className={styles.primary} disabled={!draft.name.trim()} type="submit">Continue</button></form></div> : null}
      {draft.step === "SOURCE" ? <div className={styles.stage}><p className={styles.eyebrow}>{draft.name || "Your memory"}</p><h1>Where should we start?</h1><p className={styles.lede}>You can add more sources later. Pick the easiest place to begin today.</p><div className={styles.sourceGrid}>{sources.map((item) => <button key={item.kind} type="button" className={styles.sourceChoice} onClick={() => chooseSource(item.kind)}><strong>{item.label}</strong><span>{item.description}</span></button>)}</div><p className={styles.privacy}>The MemorySpace manifest is stored locally first. Raw conversation and selected media bytes are not uploaded by this creation flow.</p></div> : null}
    </section>
  </main>;
}
