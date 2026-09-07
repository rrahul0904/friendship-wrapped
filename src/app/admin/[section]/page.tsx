import { notFound, redirect } from "next/navigation";
import { AdminNav, AdminSection } from "@/components/AdminConsole";
import { requireStoryAdmin, type AdminRole } from "@/platform/admin/auth";
import { getAdminSection } from "@/platform/admin/data";
export const dynamic="force-dynamic";
const sections=new Set(["users","products","worlds","albums","media","subscriptions","revenue","finops","integrations","audit"]);
export default async function AdminSectionPage({params}:{params:Promise<{section:string}>}){
 const {section}=await params;if(!sections.has(section))notFound();
 const allowed:AdminRole[]=section==="finops"||section==="revenue"?["admin","finance"]:section==="users"||section==="worlds"||section==="albums"||section==="media"?["admin","support"]:["admin"];
 let admin;try{admin=await requireStoryAdmin(allowed);}catch{redirect("/app?admin=denied");}
 const data=await getAdminSection(section);
 return <main className="admin-shell"><header className="admin-head"><strong>ThreadTales Operations</strong><span>{admin.role}</span></header><div className="admin-layout"><AdminNav active={section}/><section className="admin-main"><h1>{section[0].toUpperCase()+section.slice(1)}</h1><AdminSection section={section} data={data as Record<string,unknown>}/></section></div></main>;
}