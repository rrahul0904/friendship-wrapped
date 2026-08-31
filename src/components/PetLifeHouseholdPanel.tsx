"use client";

import { useCallback, useEffect, useState } from "react";
import type { PetMemory, PetProfile } from "@/products/petlife/model";

type CloudState = {
  user?: { id: string; email?: string };
  households?: Array<{ id: string; name: string; owner_id: string }>;
  memberships?: Array<{ household_id: string; user_id: string; email?: string | null; role: "owner" | "member"; can_add_memories: boolean }>;
  pets?: Array<{ id: string; household_id: string; name: string }>;
};

export function PetLifeHouseholdPanel({ profile, memories }: { profile: PetProfile; memories: PetMemory[] }) {
  const [status, setStatus] = useState<"checking" | "disabled" | "signed-out" | "ready" | "error">("checking");
  const [cloud, setCloud] = useState<CloudState>({});
  const [inviteEmail, setInviteEmail] = useState("");
  const [canAdd, setCanAdd] = useState(true);
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const readCloud = useCallback(async () => {
    const response = await fetch("/api/petlife", { cache: "no-store" });
    const data = await response.json().catch(() => ({})) as CloudState & { error?: string };
    if (response.status === 503) return { state: "disabled" as const, data };
    if (response.status === 401) return { state: "signed-out" as const, data };
    if (!response.ok) throw new Error(data.error ?? "Could not load PetLife cloud data.");
    return { state: "ready" as const, data };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => setInviteToken(new URLSearchParams(window.location.search).get("invite") ?? ""));
    void readCloud().then(({ state, data }) => {
      if (cancelled) return;
      setCloud(data);
      setStatus(state);
    }).catch((cause: unknown) => {
      if (cancelled) return;
      setMessage(cause instanceof Error ? cause.message : "Could not load PetLife cloud data.");
      setStatus("error");
    });
    return () => { cancelled = true; window.cancelAnimationFrame(frame); };
  }, [readCloud]);

  async function refresh() {
    const { state, data } = await readCloud();
    setCloud(data);
    setStatus(state);
  }

  async function syncPet() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/petlife", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile, memories }) });
      const data = await response.json() as { syncedMemories?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not sync PetLife.");
      setMessage(`Private cloud sync complete · ${data.syncedMemories ?? 0} memories.`);
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not sync PetLife.");
    } finally { setBusy(false); }
  }

  async function createInvite() {
    const household = cloud.households?.find((item) => item.owner_id === cloud.user?.id);
    if (!household) { setMessage("Sync the pet first to create its household."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/petlife/invites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ householdId: household.id, email: inviteEmail, canAddMemories: canAdd }) });
      const data = await response.json() as { inviteUrl?: string; error?: string };
      if (!response.ok || !data.inviteUrl) throw new Error(data.error ?? "Could not create invitation.");
      setInviteUrl(data.inviteUrl);
      setMessage("Invitation created. Share the link only with the invited email address; it expires in seven days.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not create invitation.");
    } finally { setBusy(false); }
  }

  async function acceptInvite() {
    if (!inviteToken) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/petlife/invites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: inviteToken }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not accept invitation.");
      setMessage("Household invitation accepted. You can now view the shared pet timeline, subject to household permissions.");
      setInviteToken("");
      window.history.replaceState(null, "", window.location.pathname);
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not accept invitation.");
    } finally { setBusy(false); }
  }

  async function removeMember(householdId: string, userId: string) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/petlife/members?householdId=${encodeURIComponent(householdId)}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not remove member.");
      setMessage("Household member removed.");
      await refresh();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Could not remove member.");
    } finally { setBusy(false); }
  }

  if (status === "checking") return <section className="story cloud-panel"><p>Checking optional PetLife household features…</p></section>;
  if (status === "disabled") return <section className="story cloud-panel"><span className="story-summary-kicker">Household collaboration</span><h3>Local-only mode is active.</h3><p>A dedicated Supabase project has not been configured for this repository, so cloud households are safely disabled. The local PetLife timeline remains fully usable.</p></section>;
  if (status === "signed-out") return <section className="story cloud-panel"><span className="story-summary-kicker">Household collaboration</span><h3>Sign in after value.</h3><p>Use the optional cloud-save panel to request a magic link before syncing a pet or accepting a household invitation.</p>{inviteToken ? <div className="notice">This URL contains a household invite. Sign in with the invited email, then reopen the link to accept it.</div> : null}</section>;
  if (status === "error") return <section className="story cloud-panel"><div className="error" role="alert">{message}</div></section>;

  const ownerHousehold = cloud.households?.find((item) => item.owner_id === cloud.user?.id);
  const members = ownerHousehold ? (cloud.memberships ?? []).filter((item) => item.household_id === ownerHousehold.id && item.role === "member") : [];

  return <section className="story cloud-panel">
    <span className="story-summary-kicker">Private household</span>
    <h3>{ownerHousehold ? ownerHousehold.name : "Sync this pet when you want collaboration"}</h3>
    <p>PetLife household data is private by default. Owners manage the pet and membership; members can add memories only when the invitation grants that permission.</p>
    <div className="premium-actions"><button className="btn btn-soft" disabled={busy} onClick={() => void syncPet()}>{busy ? "Working…" : "Sync pet + timeline privately"}</button></div>
    {inviteToken ? <div className="builder-card"><h3>Household invitation</h3><p>This action verifies both the signed-in email and the one-time token on the server.</p><button className="btn btn-primary" disabled={busy} onClick={() => void acceptInvite()}>Accept invitation</button></div> : null}
    {ownerHousehold ? <div className="builder-card"><h3>Invite household member</h3><div className="builder-grid"><label>Email<input className="share-input" type="email" aria-label="PetLife invite email" value={inviteEmail} onChange={(event)=>setInviteEmail(event.target.value)} placeholder="family@example.com"/></label><label className="toggle"><input type="checkbox" checked={canAdd} onChange={(event)=>setCanAdd(event.target.checked)}/> Member can add memories</label></div><button className="btn btn-soft" disabled={busy || !inviteEmail} onClick={() => void createInvite()}>Create 7-day invite</button>{inviteUrl ? <div className="share-actions"><input className="share-input" readOnly value={inviteUrl}/><button className="btn btn-soft" onClick={()=>void navigator.clipboard.writeText(inviteUrl)}>Copy invite</button></div> : null}</div> : null}
    {members.length ? <div className="timeline-list" aria-label="PetLife household members">{members.map((member)=><article key={member.user_id}><div><small>{member.can_add_memories ? "Can add memories" : "View only"}</small><h3>{member.email || member.user_id}</h3></div><button className="btn btn-soft" disabled={busy} onClick={()=>void removeMember(member.household_id, member.user_id)}>Remove</button></article>)}</div> : null}
    {message ? <div className="notice" role="status">{message}</div> : null}
  </section>;
}
