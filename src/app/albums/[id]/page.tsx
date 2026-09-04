import { notFound, redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { AlbumStudio } from "@/components/AlbumStudio";
import { getStorySession } from "@/platform/identity/session";
import { supabaseRest, supabaseStorageSignedUrl } from "@/platform/persistence/supabase-rest";
export const dynamic="force-dynamic";
export default async function AlbumPage({params}:{params:Promise<{id:string}>}){
 const s=await getStorySession();if(!s)redirect("/login");const{id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();
 const albums=await supabaseRest<Array<{id:string;world_id:string;title:string;description?:string|null;cover_media_id?:string|null}>>("albums?id=eq."+id+"&select=id,world_id,title,description,cover_media_id&limit=1",s.token);const album=albums[0];if(!album)notFound();
 const [items,mediaRows,links]=await Promise.all([
   supabaseRest<Array<{media_id:string;position:number;caption?:string|null;is_favorite?:boolean}>>("album_items?album_id=eq."+id+"&select=media_id,position,caption,is_favorite&order=position.asc",s.token),
   supabaseRest<Array<{id:string;object_path:string;media_kind:string;caption?:string|null}>>("media_assets?world_id=eq."+album.world_id+"&select=id,object_path,media_kind,caption&order=created_at.desc&limit=100",s.token),
   supabaseRest<Array<{track_id:string;position:number}>>("album_music_tracks?album_id=eq."+id+"&select=track_id,position&order=position.asc",s.token)
 ]);
 const media=await Promise.all(mediaRows.map(async(row)=>({...row,signedUrl:await supabaseStorageSignedUrl(row.object_path,s.token).catch(()=>null)})));
 const ids=links.map(x=>x.track_id);const tracks=ids.length?await supabaseRest<Array<{id:string;title:string;artist?:string|null;external_url?:string|null}>>("music_tracks?id=in.("+ids.join(",")+")&select=id,title,artist,external_url",s.token):[];
 return <AccountShell email={s.user.email}><div className="saas-page"><section className="saas-hero"><div><span className="story-summary-kicker">Private album</span><h1>{album.title}</h1><p>{album.description||"Arrange a visual memory chapter, then add the song that belongs to it."}</p></div></section><AlbumStudio albumId={id} worldId={album.world_id} media={media} items={items} tracks={tracks}/></div></AccountShell>;
}