export const PREMIUM_ENTITLEMENT_STORAGE_KEY = "threadtales:premium-entitlement";

export async function validateBrowserPremiumEntitlement() {
  if (typeof window === "undefined") return false;
  const token = window.localStorage.getItem(PREMIUM_ENTITLEMENT_STORAGE_KEY);
  if (!token) return false;
  try {
    const response = await fetch("/api/entitlements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
    if (!response.ok) return false;
    const data = await response.json() as { valid?: boolean };
    return Boolean(data.valid);
  } catch {
    return false;
  }
}
