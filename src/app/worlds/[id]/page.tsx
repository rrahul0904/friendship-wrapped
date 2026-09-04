import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { WorldMediaUploader } from "@/components/WorldMediaUploader";
import { getStorySession } from "@/platform/identity/session";
import { supabaseRest, supabaseStorageSignedUrl } from "@/platform/persistence/supabase-rest";
import { worldProductLabels, isWorldProduct } from "@/platform/worlds/catalog";
export const dynamic="force-dynamic";
export default async function WorldPage({params}:{params:Promise<{id:string}>}){
 const s=await getStorySession();if(!s)redirect("/login");const{id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const worlds=await supabaseRest<Array<{id:string;product:string;title:string;summary?:string|null;anchor_date?:string|null}>>("worlds?id=eq."+id+"&select=id,product,title,summary,anchor_date&limit=1",s.token);const world=worlds[0];if(!world)notFound();
 const [events,mediaRows,albums,links]=await Promise.all([
  supabaseRest<Array<{id:string;event_type:string;occurred_at:string;title:string;description?:string|null;location?:string|null}>>("story_events?world_id=eq."+id+"&select=id,event_type,occurred_at,title,description,location&order=occurred_at.desc&limit=200",s.token),
  supabaseRest<Array<{id:string;object_path:string;media_kind:string;caption?:string|null}>>("media_assets?world_id=eq."+id+"&select=id,object_path,media_kind,caption&order=created_at.desc&limit=48",s.token),
  supabaseRest<Array<{id:string;title:string;description?:string|null}>>("albums?world_id=eq."+id+"&select=id,title,description&order=updated_at.desc&limit=24",s.token),
  supabaseRest<Array<{track_id:string;position:number}>>("world_music_tracks?world_id=eq."+id+"&select=track_id,position&order=position.asc",s.token)
 ]);
 const media=await Promise.all(mediaRows.map(async(row)=>({...row,signedUrl:await supabaseStorageSignedUrl(row.object_path,s.token).catch(()=>null)})));
 const ids=links.map(x=>x.track_id);const tracks=ids.length?await supabaseRest<Array<{id:string;title:string;artist?:string|null;external_url?:string|null}>>("music_tracks?id=in.("+ids.join(",")+")&select=id,title,artist,external_url",s.token):[];
 const label=isWorldProduct(world.product)?worldProductLabels[world.product]:world.product;
 return <AccountShell email={s.user.email}><div className="saas-page"><section className="world-cover"><small>{label}{world.anchor_date?" · "+world.anchor_date:""}</small><h1>{world.title}</h1><p>{world.summary||"A private world built from the memories you choose."}</p></section>
 <section className="saas-section"><div className="saas-section-head"><div><span className="story-summary-kicker">Private media</span><h2>Pictures make the world breathe</h2></div></div><WorldMediaUploader worldId={id}/>{media.length?<div className="media-grid">{media.map(row=><article className="media-tile" key={row.id}>{row.media_kind==="image"&&row.signedUrl?<img src={row.signedUrl} alt={row.caption||"Private world memory"} loading="lazy"/>:row.media_kind==="video"&&row.signedUrl?<video src={row.signedUrl} controls preload="metadata"/>:<div className="record-disc">♪</div>}</article>)}</div>:null}</section>
 <section className="saas-section"><div className="saas-section-head"><div><span className="story-summary-kicker">Timeline</span><h2>The life of this world</h2></div></div>{events.length?<div className="memory-timeline">{events.map(event=><article key={event.id}><small>{event.occurred_at.slice(0,10)} · {event.event_type}{event.location?" · "+event.location:""}</small><h3>{event.title}</h3>{event.description?<p>{event.description}</p>:null}</article>)}</div>:<div className="saas-empty">Memories saved from the local builder will appear here after you explicitly save them to your account.</div>}</section>
 <section className="saas-section"><div className="saas-section-head"><div><span className="story-summary-kicker">Albums</span><h2>Curated chapters</h2></div><Link href="/albums">Create an album →</Link></div>{albums.length?<div className="album-shelf">{albums.map(album=><Link className="album-card world-card" href={"/albums/"+album.id} key={album.id}><small>Album</small><strong>{album.title}</strong><span>{album.description||"Open the visual story"}</span></Link>)}</div>:<div className="saas-empty">Turn selected photos and videos into an album with its own cover and soundtrack.</div>}</section>
 {tracks.length?<section className="soundtrack"><span className="story-summary-kicker">World soundtrack</span><h2>Songs attached to this memory space</h2>{tracks.map(track=><article key={track.id}><div className="record-disc">♪</div><div><strong>{track.title}</strong><p>{track.artist||"Personal soundtrack"}</p>{track.external_url?<a href={track.external_url} target="_blank" rel="noreferrer">Official link ↗</a>:null}</div></article>)}</section>:null}</div></AccountShell>;
}