import { requireSupabasePublicConfig, requireSupabaseSecretConfig } from "./config";

export interface SupabaseSessionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user?: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> };
}

type AuthErrorShape = { msg?: string; message?: string; error_description?: string; error?: string };

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
  const data = await response.json().catch(() => ({})) as T & AuthErrorShape;
  if (!response.ok) throw new Error(data.msg ?? data.message ?? data.error_description ?? data.error ?? "Supabase Auth request failed.");
  return data;
}

function normalizeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized) || normalized.length > 254) throw new Error("Enter a valid email address.");
  return normalized;
}

function assertPassword(password: string) {
  if (password.length < 10 || password.length > 128) throw new Error("Use a password between 10 and 128 characters.");
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new Error("Use at least one letter and one number.");
}

export function signUpWithPassword(email: string, password: string, displayName: string, redirectTo: string) {
  assertPassword(password);
  const name = displayName.trim().slice(0, 80);
  if (name.length < 2) throw new Error("Add your display name.");
  const query = new URLSearchParams({ redirect_to: redirectTo });
  return authFetch<SupabaseSessionResponse>(`/signup?${query.toString()}`, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), password, data: { display_name: name } }),
  });
}

export function signInWithPassword(email: string, password: string) {
  if (!password) throw new Error("Password is required.");
  return authFetch<SupabaseSessionResponse>("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), password }),
  });
}

export function refreshSupabaseSession(refreshToken: string) {
  if (!refreshToken || refreshToken.length > 4096) throw new Error("Invalid refresh token.");
  return authFetch<SupabaseSessionResponse>("/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export function sendMagicLink(email: string, redirectTo: string) {
  const query = new URLSearchParams({ redirect_to: redirectTo });
  return authFetch<Record<string, never>>(`/otp?${query.toString()}`, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email), create_user: false }),
  });
}

export function sendPasswordRecovery(email: string, redirectTo: string) {
  const query = new URLSearchParams({ redirect_to: redirectTo });
  return authFetch<Record<string, never>>(`/recover?${query.toString()}`, {
    method: "POST",
    body: JSON.stringify({ email: normalizeEmail(email) }),
  });
}

export function verifyAuthToken(tokenHash: string, type: "email" | "signup" | "recovery" | "magiclink") {
  if (!/^[A-Za-z0-9_-]{20,512}$/.test(tokenHash)) throw new Error("Invalid authentication token.");
  return authFetch<SupabaseSessionResponse>("/verify", {
    method: "POST",
    body: JSON.stringify({ token_hash: tokenHash, type }),
  });
}

export function verifyMagicLinkToken(tokenHash: string) {
  return verifyAuthToken(tokenHash, "email");
}

export function updateSupabasePassword(accessToken: string, password: string) {
  assertPassword(password);
  return authFetch<{ id: string; email?: string }>("/user", {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
}

export async function getSupabaseUser(accessToken: string) {
  return authFetch<{ id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown>; last_sign_in_at?: string; created_at?: string }>("/user", {
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
      Authorization: `Bearer ${secretKey}`,
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

export async function supabaseStorageUpload(path: string, file: Blob, accessToken: string, contentType: string) {
  const { url, publishableKey } = requireSupabasePublicConfig();
  const response = await fetch(`${url}/storage/v1/object/private-media/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
      "x-upsert": "false",
    },
    body: file,
  });
  const data = await response.json().catch(() => ({})) as { Key?: string; key?: string; message?: string };
  if (!response.ok) throw new Error(data.message ?? "Media upload failed.");
  return data;
}

export async function supabaseStorageSignedUrl(path: string, accessToken: string, expiresIn = 900) {
  const { url, publishableKey } = requireSupabasePublicConfig();
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${url}/storage/v1/object/sign/private-media/${encoded}`, {
    method: "POST",
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: Math.max(60, Math.min(expiresIn, 3600)) }),
  });
  const data = await response.json().catch(() => ({})) as { signedURL?: string; signedUrl?: string; message?: string };
  if (!response.ok) throw new Error(data.message ?? "Could not create media URL.");
  const signedPath = data.signedURL ?? data.signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed media URL.");
  return signedPath.startsWith("http") ? signedPath : `${url}/storage/v1${signedPath.startsWith("/") ? signedPath : `/${signedPath}`}`;
}

export async function supabaseStorageDelete(path: string, accessToken: string) {
  const { url, publishableKey } = requireSupabasePublicConfig();
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${url}/storage/v1/object/private-media/${encoded}`, {
    method: "DELETE",
    headers: { apikey: publishableKey, Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok && response.status !== 404) {
    const data = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? "Media delete failed.");
  }
}

const RAW_CONTENT_KEYS = new Set([
  "raw", "rawtext", "rawchat", "messages", "chatmessages", "messagetext", "sender", "transcript", "conversation", "text",
]);

export function assertDerivedStoryPayload(value: unknown) {
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
      const normalizedKey = key.replace(/[_\-\s]/g, "").toLowerCase();
      if (RAW_CONTENT_KEYS.has(normalizedKey)) throw new Error(`Cloud save rejected a raw-content field: ${key}`);
      visit(child, depth + 1);
    }
  };
  visit(value, 0);
}
