import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { AlbumCreator } from "@/components/AlbumCreator";
import { getStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
export const dynamic="force-dynamic";
export default async function AlbumsPage(){
 const s=await getStorySession(); if(!s) redirect("/login?next=/albums");
 const [worlds,albums]=await Promise.all([
  supabaseRest<Array<{id:string;title:string}>>("worlds?select=id,title&order=updated_at.desc&limit=100",s.token),
  supabaseRest<Array<{id:string;title:string;description?:string|null;updated_at:string}>>("albums?select=id,title,description,updated_at&order=updated_at.desc&limit=100",s.token)
 ]);
 return <AccountShell email={s.user.email}><div className="saas-page"><section className="saas-hero"><div><span className="story-summary-kicker">Private albums</span><h1>Your memories, art-directed.</h1><p>Choose a world, gather its photos and videos, set the order, add captions and give the album a soundtrack.</p></div><AlbumCreator worlds={worlds}/></section>
 {albums.length?<div className="album-shelf">{albums.map(a=><Link href={"/albums/"+a.id} className="album-card world-card" key={a.id}><small>Private album</small><strong>{a.title}</strong><span>{a.description||"Story · Gallery · Filmstrip"}</span></Link>)}</div>:<div className="saas-empty">No albums yet. Your first one can be a trip, a year, a pet chapter, a relationship era, a launch, or anything else worth keeping.</div>}
 </div></AccountShell>;
}