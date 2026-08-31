"use client";

import { useEffect, useMemo, useState } from "react";
import { PetLifeHouseholdPanel } from "@/components/PetLifeHouseholdPanel";
import { ProductCloudSavePanel } from "@/components/ProductCloudSavePanel";
import { downloadStoryCard } from "@/platform/export/story-card";
import { trackProductEvent } from "@/platform/telemetry/client";
import { buildPetLifeRecap, composePetLifeChapters, createPetLifeShareManifest, type PetMemory, type PetMemoryType, type PetProfile } from "@/products/petlife/model";

const LOCAL_KEY = "story-platform:petlife:v1";

interface LocalPetLifeState {
  profile: PetProfile | null;
  memories: PetMemory[];
}

function persistLocal(state: LocalPetLifeState) {
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

export function PetLifeBuilder() {
  const [profile, setProfile] = useState<PetProfile | null>(null);
  const [memories, setMemories] = useState<PetMemory[]>([]);
  const [restored, setRestored] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Dog");
  const [birthday, setBirthday] = useState("");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [memoryNote, setMemoryNote] = useState("");
  const [memoryType, setMemoryType] = useState<PetMemoryType>("memory");
  const [photoCount, setPhotoCount] = useState(0);
  const [recapYear, setRecapYear] = useState(new Date().getFullYear());
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");
  const [includePetName, setIncludePetName] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const raw = window.localStorage.getItem(LOCAL_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as LocalPetLifeState;
          if (parsed.profile?.id && Array.isArray(parsed.memories)) {
            setProfile(parsed.profile);
            setMemories(parsed.memories);
            setName(parsed.profile.name);
            setSpecies(parsed.profile.species);
            setBirthday(parsed.profile.birthday ?? "");
            setAdoptionDate(parsed.profile.adoptionDate ?? "");
          }
        }
      } catch {
        window.localStorage.removeItem(LOCAL_KEY);
      } finally {
        setRestored(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const recap = useMemo(() => {
    if (!profile) return null;
    try { return buildPetLifeRecap(profile, memories, recapYear); } catch { return null; }
  }, [profile, memories, recapYear]);
  const chapters = useMemo(() => recap ? composePetLifeChapters(recap) : [], [recap]);
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];

  function saveProfile() {
    if (!name.trim() || !species.trim()) { setMessage("Add a pet name and species first."); return; }
    const creating = !profile;
    const next: PetProfile = profile ? { ...profile, name: name.trim(), species: species.trim(), birthday: birthday || undefined, adoptionDate: adoptionDate || undefined } : { id: crypto.randomUUID(), name: name.trim(), species: species.trim(), birthday: birthday || undefined, adoptionDate: adoptionDate || undefined };
    setProfile(next);
    persistLocal({ profile: next, memories: profile ? memories : [] });
    if (creating) {
      setMemories([]);
      trackProductEvent("pet_created", "petlife");
    }
    setMessage(`${next.name}'s profile is saved on this device.`);
  }

  function addMemory() {
    if (!profile) { setMessage("Create the pet profile before adding memories."); return; }
    if (!memoryTitle.trim() || !memoryDate) { setMessage("Add a memory title and date."); return; }
    const memory: PetMemory = { id: crypto.randomUUID(), petId: profile.id, type: memoryType, date: memoryDate, title: memoryTitle.trim(), note: memoryNote.trim() || undefined, photoCount };
    const hasRecapMemory = memories.some((item) => item.date.startsWith(`${recapYear}-`));
    const next = [...memories, memory];
    setMemories(next);
    persistLocal({ profile, memories: next });
    trackProductEvent("pet_memory_added", "petlife");
    if (!hasRecapMemory && memory.date.startsWith(`${recapYear}-`)) trackProductEvent("annual_recap_created", "petlife");
    setMemoryTitle("");
    setMemoryNote("");
    setPhotoCount(0);
    setMessage(memoryType === "milestone" ? "Milestone added." : "Memory added.");
  }

  function removeMemory(id: string) {
    if (!profile) return;
    const next = memories.filter((memory) => memory.id !== id);
    setMemories(next);
    persistLocal({ profile, memories: next });
  }

  function clearLocal() {
    window.localStorage.removeItem(LOCAL_KEY);
    setProfile(null);
    setMemories([]);
    setName("");
    setSpecies("Dog");
    setBirthday("");
    setAdoptionDate("");
    setMessage("Local PetLife data was deleted from this browser.");
  }

  async function exportChapter() {
    if (!chapter) return;
    await downloadStoryCard(chapter, "vertical", true);
    trackProductEvent("story_exported", "petlife");
  }

  async function copyShareSummary() {
    if (!recap) return;
    await navigator.clipboard.writeText(JSON.stringify(createPetLifeShareManifest(recap, includePetName)));
    trackProductEvent("share_created", "petlife");
    setMessage(`Copied a privacy-safe recap manifest${includePetName ? " with the pet name" : " without the pet name"}. Notes and photo files are excluded.`);
  }

  if (!restored) return <div className="notice">Opening your local PetLife timeline…</div>;

  return <div className="product-builder" data-product="petlife">
    <section className="story product-workspace">
      <div className="chapter-head"><div><span className="story-summary-kicker">PetLife MVP</span><h2>A private timeline that is useful between annual recaps.</h2><p>The local MVP stores the profile and memory text in this browser so you can return later. Selected photo bytes are never stored locally by PetLife; only a photo count is kept with each memory.</p></div></div>
      <div className="builder-card">
        <h3>{profile ? `Edit ${profile.name}` : "Create a pet profile"}</h3>
        <div className="builder-grid"><label>Pet name<input className="share-input" aria-label="Pet name" value={name} maxLength={80} onChange={(event)=>setName(event.target.value)}/></label><label>Species<input className="share-input" aria-label="Pet species" value={species} maxLength={60} onChange={(event)=>setSpecies(event.target.value)}/></label><label>Birthday (optional)<input className="share-input" type="date" value={birthday} onChange={(event)=>setBirthday(event.target.value)}/></label><label>Adoption day (optional)<input className="share-input" type="date" value={adoptionDate} onChange={(event)=>setAdoptionDate(event.target.value)}/></label></div>
        <div className="premium-actions"><button className="btn btn-primary" onClick={saveProfile}>{profile ? "Update profile" : "Create pet"}</button>{profile ? <button className="btn btn-soft" onClick={clearLocal}>Delete local PetLife data</button> : null}</div>
      </div>

      {profile ? <div className="builder-card"><h3>Add to {profile.name}&apos;s timeline</h3><div className="builder-grid"><label>Type<select className="select" value={memoryType} onChange={(event)=>setMemoryType(event.target.value as PetMemoryType)}><option value="memory">Memory</option><option value="milestone">Milestone</option></select></label><label>Date<input className="share-input" aria-label="Pet memory date" type="date" value={memoryDate} onChange={(event)=>setMemoryDate(event.target.value)}/></label><label>Title<input className="share-input" aria-label="Pet memory title" value={memoryTitle} maxLength={120} onChange={(event)=>setMemoryTitle(event.target.value)} placeholder="First beach day"/></label><label>Note (optional)<input className="share-input" value={memoryNote} maxLength={500} onChange={(event)=>setMemoryNote(event.target.value)} placeholder="The detail you want to remember"/></label></div><label className="file-drop">Photo selection (local only)<input aria-label="Choose PetLife photos" type="file" accept="image/*" multiple onChange={(event)=>setPhotoCount(Math.min(12,event.target.files?.length ?? 0))}/><span>{photoCount ? `${photoCount} photo${photoCount===1?"":"s"} selected for this memory` : "No photo selected"}</span></label><button className="btn btn-primary" onClick={addMemory}>Add to timeline</button></div> : null}
      {message ? <div className="notice" role="status">{message}</div> : null}
      {profile ? <div className="timeline-list" aria-label="PetLife timeline">{memories.length ? [...memories].sort((a,b)=>b.date.localeCompare(a.date)).map((memory)=><article key={memory.id}><div><small>{memory.date} · {memory.type}</small><h3>{memory.title}</h3><p>{memory.note || `${memory.photoCount} selected photo${memory.photoCount===1?"":"s"}`}</p></div><button className="btn btn-soft" onClick={()=>removeMemory(memory.id)}>Delete</button></article>) : <div className="notice">The timeline is empty. Add a memory or milestone above.</div>}</div> : null}
    </section>

    {profile ? <PetLifeHouseholdPanel profile={profile} memories={memories}/> : null}

    {profile && recap && memories.length ? <>
      <section className="story chapter-deck" aria-label="PetLife annual recap">
        <div className="chapter-head"><div><span className="story-summary-kicker">Annual recap</span><h3>{profile.name}&apos;s {recapYear}</h3><p>{recap.memories.length} saved memories · {recap.milestoneCount} milestones.</p></div><div className="chapter-export-controls"><label>Recap year<input className="select" type="number" min="1900" max="2200" value={recapYear} onChange={(event)=>{setRecapYear(Number(event.target.value));setActive(0);}}/></label><button className="btn btn-primary" onClick={()=>void exportChapter()}>Download 9:16 card</button></div></div>
        {chapter ? <><div className="chapter-preview theme-emerald"><small>{chapter.type.replace("-"," ")}</small><h3>{chapter.title}</h3>{chapter.metric!==undefined?<strong>{chapter.metric}</strong>:null}{chapter.subtitle?<span>{chapter.subtitle}</span>:null}{chapter.supportingText?<p>{chapter.supportingText}</p>:null}<div className="chapter-privacy">{chapter.privacyLevel==="safe"?"Share-safe derived fact":"Private memory · local unless selected"}</div></div><div className="chapter-nav"><button className="btn btn-soft" disabled={active===0} onClick={()=>setActive((value)=>Math.max(0,value-1))}>← Previous</button><div className="chapter-dots">{chapters.map((item,index)=><button key={item.id} aria-label={`Open PetLife chapter ${index+1}`} className={index===active?"active":""} onClick={()=>setActive(index)}/>)}</div><button className="btn btn-soft" disabled={active===chapters.length-1} onClick={()=>setActive((value)=>Math.min(chapters.length-1,value+1))}>Next →</button></div></>:null}
        <label className="toggle"><input type="checkbox" checked={includePetName} onChange={(event)=>setIncludePetName(event.target.checked)}/> Include pet name in copied public recap summary</label><button className="btn btn-soft" onClick={()=>void copyShareSummary()}>Copy safe recap summary</button>
      </section>
      <ProductCloudSavePanel product="petlife" title={`${profile.name}'s ${recapYear}`} result={recap} description="PetLife cloud save is optional. When configured, the derived annual recap can be saved after sign-in; local photo bytes are not included in this MVP payload."/>
    </> : null}
  </div>;
}
