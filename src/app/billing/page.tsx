import { redirect } from "next/navigation";
import { AccountShell } from "@/components/AccountShell";
import { BillingClient } from "@/components/BillingClient";
import { getStorySession } from "@/platform/identity/session";
import { getUserSubscription } from "@/platform/billing/subscription";
import { planCatalog } from "@/platform/billing/plans";
import { supabaseRest } from "@/platform/persistence/supabase-rest";
export const dynamic="force-dynamic";
export default async function BillingPage(){
 const s=await getStorySession(); if(!s) redirect("/login?next=/billing");
 const [sub,media]=await Promise.all([getUserSubscription(s.user.id,s.token),supabaseRest<Array<{size_bytes:number|null}>>("media_assets?select=size_bytes&limit=5000",s.token)]);
 const p=planCatalog[sub.plan_slug],bytes=media.reduce((a,x)=>a+Number(x.size_bytes??0),0);
 return <AccountShell email={s.user.email}><div className="saas-page"><section className="saas-hero"><div><span className="story-summary-kicker">Billing</span><h1>Pay for permanence, not basic insight.</h1><p>ThreadTales local analysis remains free. Paid Story Platform plans add cloud worlds, private media, albums, collaboration and higher limits.</p></div><div className="settings-panel"><strong>{p.label}</strong><span>{sub.status}</span><span>{(bytes/1024/1024).toFixed(1)} MB used</span>{sub.current_period_end?<small>Current period ends {new Date(sub.current_period_end).toLocaleDateString()}</small>:null}</div></section><BillingClient currentPlan={sub.plan_slug}/></div></AccountShell>;
}