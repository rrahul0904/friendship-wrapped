import { createHmac, timingSafeEqual } from "node:crypto";

export interface PremiumEntitlement {
  v: 1;
  product: "threadtales-premium";
  sessionId: string;
  exp: number;
}

function secret() {
  const value = process.env.ENTITLEMENT_SIGNING_SECRET;
  if (!value) throw new Error("ENTITLEMENT_SIGNING_SECRET is not configured.");
  return value;
}

function signPayload(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createEntitlementToken(sessionId: string, lifetimeSeconds = 60 * 60 * 24 * 365): string {
  const entitlement: PremiumEntitlement = {
    v: 1,
    product: "threadtales-premium",
    sessionId,
    exp: Math.floor(Date.now() / 1000) + lifetimeSeconds,
  };
  const payload = Buffer.from(JSON.stringify(entitlement), "utf8").toString("base64url");
  return `${payload}.${signPayload(payload)}`;
}

export function verifyEntitlementToken(token: string): PremiumEntitlement | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(signPayload(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const entitlement = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PremiumEntitlement;
    if (entitlement.v !== 1 || entitlement.product !== "threadtales-premium" || entitlement.exp <= Math.floor(Date.now() / 1000)) return null;
    return entitlement;
  } catch {
    return null;
  }
}
