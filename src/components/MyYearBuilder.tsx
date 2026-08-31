"use client";

import { useMemo, useState } from "react";
import { ProductCloudSavePanel } from "@/components/ProductCloudSavePanel";
import { downloadStoryCard } from "@/platform/export/story-card";
import { trackProductEvent } from "@/platform/telemetry/client";
import { buildMyYearSummary, composeMyYearChapters, createMyYearShareManifest, type MyYearMoment } from "@/products/myyear/model";

interface PhotoMeta {
  name: string;
  type: string;
  lastModified: number;
}

function todayForYear(year: number) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MyYearBuilder() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState(`My ${new Date().getFullYear()}`);
  const [moments, setMoments] = useState<MyYearMoment[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDate, setDraftDate] = useState(todayForYear(new Date().getFullYear()));
  const [draftCaption, setDraftCaption] = useState("");
  const [draftLocation, setDraftLocation] = useState("");
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [active, setActive] = useState(0);
  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    try {
      return buildMyYearSummary(year, title, moments);
    } catch {
      return null;
    }
  }, [year, title, moments]);
  const chapters = useMemo(() => summary ? composeMyYearChapters(summary) : [], [summary]);
  const chapter = chapters[Math.min(active, Math.max(0, chapters.length - 1))];

  function changeYear(next: number) {
    setYear(next);
    setTitle((current) => /^My \d{4}$/.test(current) ? `My ${next}` : current);
    setDraftDate(todayForYear(next));
    setMoments([]);
    setActive(0);
    setMessage("Changing the year cleared the local draft so dates cannot silently cross years.");
  }

  function selectPhotos(files: FileList | null) {
    if (!files) { setPhotos([]); return; }
    setPhotos(Array.from(files).slice(0, 12).map((file) => ({ name: file.name, type: file.type || "unknown", lastModified: file.lastModified })));
  }

  function addMoment() {
    setMessage("");
    if (!draftTitle.trim()) { setMessage("Give this moment a short title."); return; }
    if (!draftDate || !draftDate.startsWith(`${year}-`)) { setMessage(`Choose a date inside ${year}.`); return; }
    const moment: MyYearMoment = {
      id: crypto.randomUUID(),
      title: draftTitle.trim(),
      date: draftDate,
      caption: draftCaption.trim() || undefined,
      location: draftLocation.trim() || undefined,
      photoCount: photos.length,
    };
    if (moments.length === 0) trackProductEvent("myyear_created", "myyear");
    setMoments((current) => [...current, moment]);
    setDraftTitle("");
    setDraftCaption("");
    setDraftLocation("");
    setPhotos([]);
  }

  async function exportChapter() {
    if (!chapter) return;
    await downloadStoryCard(chapter, "vertical", true);
    trackProductEvent("story_exported", "myyear");
  }

  async function copyShareSummary() {
    if (!summary) return;
    await navigator.clipboard.writeText(JSON.stringify(createMyYearShareManifest(summary)));
    trackProductEvent("share_created", "myyear");
    setMessage("Copied a privacy-safe MyYear share manifest. Photo files, captions and locations are excluded by default.");
  }

  return <div className="product-builder" data-product="myyear">
    <section className="story product-workspace">
      <div className="chapter-head"><div><span className="story-summary-kicker">MyYear.World MVP</span><h2>Build your year from moments you choose.</h2><p>Photos stay in this browser for the MVP. The story model stores only the moment fields you explicitly add, and public share summaries omit photo files, captions and locations by default.</p></div></div>
      <div className="builder-grid">
        <label>Year<input className="select" type="number" min="1900" max="2200" value={year} onChange={(event) => changeYear(Number(event.target.value))}/></label>
        <label>Year title<input className="share-input" value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)}/></label>
      </div>
      <div className="builder-card">
        <h3>Add a moment</h3>
        <div className="builder-grid">
          <label>Title<input className="share-input" aria-label="MyYear moment title" value={draftTitle} maxLength={120} onChange={(event) => setDraftTitle(event.target.value)} placeholder="The trip we kept talking about"/></label>
          <label>Date<input className="share-input" aria-label="MyYear moment date" type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)}/></label>
          <label>Location (optional)<input className="share-input" value={draftLocation} maxLength={120} onChange={(event) => setDraftLocation(event.target.value)} placeholder="Boston, MA"/></label>
          <label>Caption (optional)<input className="share-input" value={draftCaption} maxLength={240} onChange={(event) => setDraftCaption(event.target.value)} placeholder="One line you want to remember"/></label>
        </div>
        <label className="file-drop">Selected photos (local only)<input aria-label="Choose MyYear photos" type="file" accept="image/*" multiple onChange={(event) => selectPhotos(event.target.files)}/></label>
        {photos.length ? <div className="metadata-list">{photos.map((photo) => <span key={`${photo.name}-${photo.lastModified}`}>{photo.name} · {photo.type} · {new Date(photo.lastModified).toLocaleDateString()}</span>)}</div> : null}
        <button className="btn btn-primary" onClick={addMoment}>Add moment</button>
      </div>
      {message ? <div className="notice" role="status">{message}</div> : null}
      <div className="timeline-list" aria-label="MyYear timeline">{moments.length ? [...moments].sort((a,b)=>a.date.localeCompare(b.date)).map((moment) => <article key={moment.id}><div><small>{moment.date}{moment.location ? ` · ${moment.location}` : ""}</small><h3>{moment.title}</h3><p>{moment.caption || `${moment.photoCount} selected photo${moment.photoCount === 1 ? "" : "s"}`}</p></div><button className="btn btn-soft" onClick={() => setMoments((current) => current.filter((item) => item.id !== moment.id))}>Remove</button></article>) : <div className="notice">Add at least one moment to generate your year recap.</div>}</div>
    </section>

    {summary && chapter ? <>
      <section className="story chapter-deck" aria-label="MyYear story chapters">
        <div className="chapter-head"><div><span className="story-summary-kicker">Year recap</span><h3>{summary.title} · {chapters.length} chapters</h3><p>{summary.moments.length} moments across {summary.eras.length} deterministic eras.</p></div><div className="premium-actions"><button className="btn btn-primary" onClick={() => void exportChapter()}>Download 9:16 card</button><button className="btn btn-soft" onClick={() => void copyShareSummary()}>Copy safe share summary</button></div></div>
        <div className="chapter-preview theme-violet"><small>{chapter.type.replace("-", " ")}</small><h3>{chapter.title}</h3>{chapter.metric !== undefined ? <strong>{chapter.metric}</strong> : null}{chapter.subtitle ? <span>{chapter.subtitle}</span> : null}{chapter.supportingText ? <p>{chapter.supportingText}</p> : null}<div className="chapter-privacy">{chapter.privacyLevel === "safe" ? "Share-safe derived fact" : "Personal moment · local unless selected"}</div></div>
        <div className="chapter-nav"><button className="btn btn-soft" disabled={active === 0} onClick={() => setActive((value) => Math.max(0, value - 1))}>← Previous</button><div className="chapter-dots">{chapters.map((item,index)=><button key={item.id} aria-label={`Open MyYear chapter ${index + 1}`} className={index===active?"active":""} onClick={()=>setActive(index)}/>)}</div><button className="btn btn-soft" disabled={active === chapters.length - 1} onClick={() => setActive((value) => Math.min(chapters.length - 1, value + 1))}>Next →</button></div>
      </section>
      <ProductCloudSavePanel product="myyear" title={summary.title} result={summary} description="MyYear cloud save is optional. The derived timeline is stored only after sign-in; selected browser photo bytes are not uploaded by this MVP."/>
    </> : null}
  </div>;
}
