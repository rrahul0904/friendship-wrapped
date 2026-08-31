import { requireSupabasePublicConfig, requireSupabaseSecretConfig } from "./config";

interface SupabaseSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user?: { id: string; email?: string };
}

async function authFetch<T>(path: string, init: RequestInit = {}) {
  const { url, publishableKey } = requireSupabasePublicConfig();
  const response = await fetch(`${url}/auth/v1${path}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({})) as T & { msg?: string; message?: string; error_description?: string };
  if (!response.ok) throw new Error(data.msg ?? data.message ?? data.error_description ?? "Supabase Auth request failed.");
  return data;
}

export function sendMagicLink(email: string, redirectTo: string) {
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) throw new Error("Enter a valid email address.");
  const query = new URLSearchParams({ redirect_to: redirectTo });
  return authFetch<Record<string, never>>(`/otp?${query.toString()}`, {
    method: "POST",
    body: JSON.stringify({ email, create_user: true }),
  });
}

export function verifyMagicLinkToken(tokenHash: string): Promise<SupabaseSessionResponse> {
  if (!/^[A-Za-z0-9_-]{20,512}$/.test(tokenHash)) throw new Error("Invalid magic-link token.");
  return authFetch<SupabaseSessionResponse>("/verify", {
    method: "POST",
    body: JSON.stringify({ token_hash: tokenHash, type: "email" }),
  });
}

export async function getSupabaseUser(accessToken: string) {
  return authFetch<{ id: string; email?: string }>("/user", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function supabaseRest<T>(tableAndQuery: string, accessToken: string, init: RequestInit = {}) {
  const { url, publishableKey } = requireSupabasePublicConfig();
  const response = await fetch(`${url}/rest/v1/${tableAndQuery}`, {
    ...init,
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (response.status === 204) return null as T;
  const data = await response.json().catch(() => null) as T | { message?: string; details?: string } | null;
  if (!response.ok) {
    const error = data as { message?: string; details?: string } | null;
    throw new Error(error?.message ?? error?.details ?? "Supabase Data API request failed.");
  }
  return data as T;
}

export async function supabaseAdminRest<T>(tableAndQuery: string, init: RequestInit = {}) {
  const { url, secretKey } = requireSupabaseSecretConfig();
  const response = await fetch(`${url}/rest/v1/${tableAndQuery}`, {
    ...init,
    headers: {
      apikey: secretKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (response.status === 204) return null as T;
  const data = await response.json().catch(() => null) as T | { message?: string; details?: string } | null;
  if (!response.ok) {
    const error = data as { message?: string; details?: string } | null;
    throw new Error(error?.message ?? error?.details ?? "Supabase admin request failed.");
  }
  return data as T;
}

export function assertDerivedStoryPayload(value: unknown) {
  const forbidden = new Set(["raw", "rawText", "rawChat", "chatMessages", "messageText", "text"]);
  const visit = (node: unknown, depth: number) => {
    if (depth > 20) throw new Error("Story payload is too deeply nested.");
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      if (node.length > 5000) throw new Error("Story payload is too large to save.");
      node.forEach((item) => visit(item, depth + 1));
      return;
    }
    const record = node as Record<string, unknown>;
    if ("sender" in record && "timestamp" in record && "text" in record) throw new Error("Raw chat messages cannot be saved to cloud persistence.");
    for (const [key, child] of Object.entries(record)) {
      if (forbidden.has(key)) throw new Error(`Cloud save rejected a raw-content field: ${key}`);
      visit(child, depth + 1);
    }
  };
  visit(value, 0);
}
