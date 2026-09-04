import { NextResponse } from "next/server";
import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
export const runtime = "nodejs";
export async function GET() {
  try {
    const session = await requireStorySession();
    const [profiles, worlds, events, albums, albumItems, tracks] = await Promise.all([
      supabaseRest<Array<Record<string, unknown>>>("profiles?select=user_id,display_name,timezone,locale,interests,created_at,updated_at", session.token),
      supabaseRest<Array<Record<string, unknown>>>("worlds?select=id,product,title,anchor_date,visibility,summary,created_at,updated_at&order=created_at.asc", session.token),
      supabaseRest<Array<Record<string, unknown>>>("story_events?select=id,world_id,product,event_type,occurred_at,title,description,people,location,metadata,created_at&order=occurred_at.asc&limit=5000", session.token),
      supabaseRest<Array<Record<string, unknown>>>("albums?select=id,world_id,title,description,start_date,end_date,privacy,created_at,updated_at&order=created_at.asc", session.token),
      supabaseRest<Array<Record<string, unknown>>>("album_items?select=album_id,media_id,position,caption,occurred_at,is_favorite&order=position.asc&limit=5000", session.token),
      supabaseRest<Array<Record<string, unknown>>>("music_tracks?select=id,title,artist,album,external_url,provider,memory_date,note,created_at&order=created_at.asc", session.token),
    ]);
    return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), profile: profiles[0] ?? null, worlds, events, albums, albumItems, musicTracks: tracks }, { headers: { "Content-Disposition": 'attachment; filename="threadtales-account-export.json"', "Cache-Control": "no-store" } });
  } catch (cause) { const message = cause instanceof Error ? cause.message : "Could not export account data."; return NextResponse.json({ error: message === "AUTH_REQUIRED" ? "Authentication required." : message }, { status: message === "AUTH_REQUIRED" ? 401 : 400 }); }
}
