import { redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { SettingsClient } from "@/components/SettingsClient";
import { getStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
export const dynamic="force-dynamic";
export default async function SettingsPage(){
 const s=await getStorySession(); if(!s) redirect("/login?next=/settings");
 const rows=await supabaseRest<Array<{display_name?:string|null;timezone?:string|null;locale?:string|null;interests?:string[]}>>("profiles?select=display_name,timezone,locale,interests&limit=1",s.token);
 return <AccountShell email={s.user.email}><div className="saas-page"><section className="saas-hero"><div><span className="story-summary-kicker">Account</span><h1>Your story, your controls.</h1><p>Profile settings, privacy, account export and permanent deletion live here.</p></div></section><SettingsClient profile={rows[0]??null}/></div></AccountShell>;
}