"use client";

import { useEffect, useMemo, useState } from "react";
import { trackProductEvent } from "@/platform/telemetry/client";

type CloudState = {
  user?: { id: string };
  households?: Array<{ id: string; owner_id: string }>;
  memberships?: Array<{ household_id: string; user_id: string; role: "owner" | "member"; can_add_memories: boolean }>;
  pets?: Array<{ id: string; household_id: string; name: string }>;
};

export function PetLifeSharedMemoryPanel() {
  const [cloud, setCloud] = useState<CloudState | null>(null);
  const [petId, setPetId] = useState("");
  const [type, setType] = useState<"memory" | "milestone">("memory");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/petlife", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<CloudState> : null)
      .then((data) => { if (!cancelled) setCloud(data); })
      .catch(() => { if (!cancelled) setCloud(null); });
    return () => { cancelled = true; };
  }, []);

  const writablePets = useMemo(() => {
    if (!cloud?.user) return [];
    const owned = new Set((cloud.households ?? []).filter((household) => household.owner_id === cloud.user?.id).map((household) => household.id));
    const writableMemberships = new Set((cloud.memberships ?? [])
      .filter((membership) => membership.user_id === cloud.user?.id && (membership.role === "owner" || membership.can_add_memories))
      .map((membership) => membership.household_id));
    return (cloud.pets ?? []).filter((pet) => owned.has(pet.household_id) || writableMemberships.has(pet.household_id));
  }, [cloud]);

  useEffect(() => {
    if (petId || !writablePets[0]) return;
    const frame = window.requestAnimationFrame(() => setPetId(writablePets[0].id));
    return () => window.cancelAnimationFrame(frame);
  }, [petId, writablePets]);

  if (!writablePets.length) return null;

  async function addSharedMemory() {
    if (!petId || !title.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/petlife/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId, type, date, title: title.trim(), note: note.trim() || undefined, photoCount: 0 }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not add this shared memory.");
      trackProductEvent("pet_memory_added", "petlife");
      setTitle("");
      setNote("");
      setMessage("Shared memory added with your household permission.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not add this shared memory.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="story cloud-panel">
    <span className="story-summary-kicker">Shared household contribution</span>
    <h3>Add to a pet you share.</h3>
    <p>This form appears only when your signed-in household role is allowed to add memories. The server and RLS policy enforce the same permission again.</p>
    <div className="builder-grid">
      <label>Shared pet<select className="select" aria-label="Shared PetLife pet" value={petId} onChange={(event) => setPetId(event.target.value)}>{writablePets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>
      <label>Type<select className="select" aria-label="Shared PetLife memory type" value={type} onChange={(event) => setType(event.target.value as "memory" | "milestone")}><option value="memory">Memory</option><option value="milestone">Milestone</option></select></label>
      <label>Date<input className="share-input" aria-label="Shared PetLife memory date" type="date" value={date} onChange={(event) => setDate(event.target.value)}/></label>
      <label>Title<input className="share-input" aria-label="Shared PetLife memory title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)}/></label>
      <label>Note (optional)<input className="share-input" aria-label="Shared PetLife memory note" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)}/></label>
    </div>
    <button className="btn btn-soft" disabled={busy || !title.trim()} onClick={() => void addSharedMemory()}>{busy ? "Adding…" : "Add shared memory"}</button>
    {message ? <div className="notice" role="status">{message}</div> : null}
  </section>;
}
