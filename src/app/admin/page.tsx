import { redirect } from "next/navigation";
import { AdminNav, AdminOverview } from "@/components/AdminConsole";
import { requireStoryAdmin } from "@/platform/admin/auth";
import { getAdminOverview } from "@/platform/admin/data";
export const dynamic="force-dynamic";
export default async function AdminPage(){
 let admin;try{admin=await requireStoryAdmin(["admin","support","finance"]);}catch{redirect("/app?admin=denied");}
 const data=await getAdminOverview();
 return <main className="admin-shell"><header className="admin-head"><strong>ThreadTales Operations</strong><span>{admin.role}</span></header><div className="admin-layout"><AdminNav/><section className="admin-main"><h1>Platform overview</h1><p>Operational metadata only. Private story content is not an admin KPI.</p><AdminOverview data={data}/></section></div></main>;
}