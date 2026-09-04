import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { AccountDashboardClient } from "@/components/AccountDashboardClient";
import { getStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
import { getUserSubscription } from "@/platform/billing/subscription";
import { planCatalog } from "@/platform/billing/plans";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const s = await getStorySession();
  if (!s) redirect("/login?next=/app");
  const [profiles, worlds, albums, media, subscription] = await Promise.all([
    supabaseRest<Array<{ display_name?: string | null }>>("profiles?select=display_name&limit=1", s.token),
    supabaseRest<Array<{ id: string; product: string; title: string; summary?: string | null; updated_at: string }>>("worlds?select=id,product,title,summary,updated_at&order=updated_at.desc&limit=24", s.token),
    supabaseRest<Array<{ id: string; world_id: string; title: string; description?: string | null; updated_at: string }>>("albums?select=id,world_id,title,description,updated_at&order=updated_at.desc&limit=12", s.token),
    supabaseRest<Array<{ size_bytes: number | null }>>("media_assets?select=size_bytes&limit=5000", s.token),
    getUserSubscription(s.user.id, s.token),
  ]);
  const storage = media.reduce((sum, row) => sum + Number(row.size_bytes ?? 0), 0);
  const plan = planCatalog[subscription.plan_slug];
  const greeting = profiles[0]?.display_name ? "Welcome back, " + profiles[0].display_name + "." : "Your memories have somewhere to live.";

  return <AccountShell email={s.user.email}>
    <div className="saas-page">
      <section className="saas-hero">
        <div><span className="story-summary-kicker">Your private story space</span><h1>{greeting}</h1><p>Keep personal worlds, photo albums and soundtracks together—without changing ThreadTales&apos; browser-local raw-chat promise.</p></div>
        <AccountDashboardClient/>
      </section>
      <section className="saas-section"><div className="saas-section-head"><div><span className="story-summary-kicker">Memory worlds</span><h2>Continue a world</h2></div><Link href="/products">Explore all products →</Link></div>
        {worlds.length ? <div className="world-shelf">{worlds.map((world) => <Link href={"/worlds/" + world.id} className="world-card" key={world.id}><small>{world.product}</small><strong>{world.title}</strong><span>{world.summary || "Open the timeline, media and albums"}</span></Link>)}</div> : <div className="saas-empty">Your shelf is empty. Start with MyYear, PetLife, a relationship world, LifeMap, family history, FounderWorld or CreatorWorld.</div>}
      </section>
      <section className="saas-section"><div className="saas-section-head"><div><span className="story-summary-kicker">Albums</span><h2>Stories you can see</h2></div><Link href="/albums">Open albums →</Link></div>
        {albums.length ? <div className="album-shelf">{albums.map((album) => <Link href={"/albums/" + album.id} className="album-card world-card" key={album.id}><small>Private album</small><strong>{album.title}</strong><span>{album.description || "Photos, moments and soundtrack"}</span></Link>)}</div> : <div className="saas-empty">Create an album when a world has photos you want to turn into a visual story.</div>}
      </section>
      <section className="saas-section"><div className="settings-panel"><span className="story-summary-kicker">Plan & storage</span><h2>{plan.label}</h2><p>{(storage / 1024 / 1024).toFixed(1)} MB used.</p><Link className="btn btn-soft" href="/billing">View billing & limits</Link></div></section>
    </div>
  </AccountShell>;
}