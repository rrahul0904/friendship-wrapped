import { requireStorySession } from "@/platform/identity/session";
import { supabaseRest } from "@/platform/persistence/supabase-rest";

export type AdminRole = "admin" | "support" | "finance";

export async function requireStoryAdmin(allowed: AdminRole[] = ["admin", "support", "finance"]) {
  const session = await requireStorySession();
  const rows = await supabaseRest<{ role: AdminRole }[]>(
    `admin_roles?user_id=eq.${encodeURIComponent(session.user.id)}&select=role&limit=1`,
    session.token,
  );
  const role = rows[0]?.role;
  if (!role || !allowed.includes(role)) throw new Error("ADMIN_REQUIRED");
  return { ...session, role };
}
