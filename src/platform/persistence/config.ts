export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

export function requireSupabasePublicConfig() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Supabase persistence is not configured.");
  return config;
}

export function requireSupabaseSecretConfig() {
  const publicConfig = requireSupabasePublicConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("Supabase server persistence is not configured.");
  return { ...publicConfig, secretKey };
}

export function isSupabaseConfigured() {
  return Boolean(getSupabasePublicConfig());
}
