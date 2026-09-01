const base = (process.env.PRODUCTION_URL || "https://threadtales-five.vercel.app").replace(/\/$/, "");
const requireAllIntegrations = process.env.REQUIRE_ALL_INTEGRATIONS === "1";
const expectedStripeMode = process.env.EXPECTED_STRIPE_MODE || (base === "https://threadtales-five.vercel.app" ? "live" : "test");

const publicRoutes = [
  "/",
  "/create",
  "/create?demo=1",
  "/products",
  "/products/friendship",
  "/products/myyear",
  "/products/petlife",
  "/occasions",
  "/occasions/birthday",
  "/occasions/anniversary",
  "/occasions/long-distance",
  "/occasions/graduation",
  "/occasions/year-together",
  "/privacy",
  "/account",
  "/share",
  "/premium/success",
  "/robots.txt",
  "/sitemap.xml",
];

async function checkRoute(path) {
  const response = await fetch(`${base}${path}`, { redirect: "follow" });
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  return { path, status: response.status };
}

async function checkIntegrationStatus() {
  const response = await fetch(`${base}/api/integrations/status`, { cache: "no-store" });
  if (!response.ok) throw new Error(`/api/integrations/status returned HTTP ${response.status}`);
  const status = await response.json();
  const expectedShape = status && typeof status === "object" && status.stripe && status.supabase && status.ai && status.telemetry;
  if (!expectedShape) throw new Error("Integration status response has an unexpected shape.");

  if (requireAllIntegrations) {
    const missing = [];
    if (!status.stripe.checkout) missing.push("stripe.checkout");
    if (!status.stripe.webhook) missing.push("stripe.webhook");
    if (!status.supabase.public) missing.push("supabase.public");
    if (!status.supabase.server) missing.push("supabase.server");
    if (!status.ai.enabled) missing.push("ai.enabled");
    if (!status.telemetry.enabled) missing.push("telemetry.enabled");
    if (missing.length) throw new Error(`Production integrations are not fully active: ${missing.join(", ")}`);
  }

  return status;
}

async function checkStripeRoundTrip() {
  if (expectedStripeMode === "test") {
    const response = await fetch(`${base}/api/integrations/stripe-preview-smoke`, { cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Stripe Preview smoke returned HTTP ${response.status}: ${data.error ?? "unknown error"}`);
    if (!data.ok || !data.hasCheckoutUrl || !/^cs_test_[A-Za-z0-9_]+$/.test(String(data.sessionId ?? ""))) {
      throw new Error("Stripe Preview smoke did not create a real test Checkout Session.");
    }
    return { environment: "test", sessionId: data.sessionId, checkoutCreated: true };
  }

  if (expectedStripeMode !== "live") throw new Error(`Unsupported EXPECTED_STRIPE_MODE: ${expectedStripeMode}`);
  const response = await fetch(`${base}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "friends" }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Production Checkout smoke returned HTTP ${response.status}: ${data.error ?? "unknown error"}`);
  let checkoutUrl;
  try {
    checkoutUrl = new URL(String(data.url ?? ""));
  } catch {
    throw new Error("Production Checkout smoke did not return a valid Checkout URL.");
  }
  if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
    throw new Error("Production Checkout smoke did not return a Stripe-hosted Checkout URL.");
  }
  if (!checkoutUrl.href.includes("cs_live_")) {
    throw new Error("Production Checkout smoke did not create a live-mode Checkout Session.");
  }
  return { environment: "live", checkoutCreated: true, host: checkoutUrl.hostname };
}

async function checkAiRoundTrip() {
  const privateMarkers = ["SECRET_RAW_CHAT_ALPHA", "SECRET_RAW_CHAT_BETA", "PRIVATE_UNSHARED_SENTENCE"];
  const payload = {
    product: "threadtales",
    mode: "friends",
    facts: {
      totalMessages: 42,
      totalWords: 420,
      daysTogether: 365,
      activeDays: 120,
      longestStreak: 8,
      longestSilenceDays: 5,
      medianReplyMinutes: 14,
      peakHour: 20,
      favoriteWeekday: "Friday",
      lateNightMessages: 7,
      questionsAsked: 21,
      laughSignals: 16,
      heartSignals: 9,
      mediaSignals: 3,
      conversationBalance: 91,
      yearCount: 2,
    },
    chapters: [
      { id: "scale", type: "scale", title: "A year in messages", metric: 42, renderVariant: "metric" },
    ],
  };
  const serialized = JSON.stringify(payload);
  for (const marker of privateMarkers) {
    if (serialized.includes(marker)) throw new Error(`AI verification payload unexpectedly contains ${marker}.`);
  }

  const response = await fetch(`${base}/api/ai/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: serialized,
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AI enrichment smoke returned HTTP ${response.status}: ${data.error ?? "unknown error"}`);
  if (typeof data.text !== "string" || !data.text.trim() || data.provider !== "openai" || typeof data.model !== "string") {
    throw new Error("AI enrichment smoke returned an unexpected provider response.");
  }
  return { provider: data.provider, model: data.model, responded: true };
}

async function checkTelemetryRoundTrip() {
  const response = await fetch(`${base}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "analysis_started", product: "threadtales", mode: "friends" }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (response.status !== 202 || data.accepted !== true || data.delivered !== true) {
    throw new Error(`Telemetry smoke was not delivered (HTTP ${response.status}).`);
  }
  return { delivered: true };
}

const results = [];
for (const route of publicRoutes) results.push(await checkRoute(route));
const integrations = await checkIntegrationStatus();
const remote = requireAllIntegrations ? {
  stripe: await checkStripeRoundTrip(),
  ai: await checkAiRoundTrip(),
  telemetry: await checkTelemetryRoundTrip(),
} : null;

console.log(JSON.stringify({
  productionUrl: base,
  checkedAt: new Date().toISOString(),
  routes: results,
  integrations,
  remote,
  fullyLiveGate: requireAllIntegrations ? "PASS" : "NOT_REQUIRED",
}, null, 2));
