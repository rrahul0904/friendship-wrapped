const base = (process.env.PRODUCTION_URL || "https://threadtales-five.vercel.app").replace(/\/$/, "");
const requireAllIntegrations = process.env.REQUIRE_ALL_INTEGRATIONS === "1";

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

const results = [];
for (const route of publicRoutes) results.push(await checkRoute(route));
const integrations = await checkIntegrationStatus();

console.log(JSON.stringify({
  productionUrl: base,
  checkedAt: new Date().toISOString(),
  routes: results,
  integrations,
  fullyLiveGate: requireAllIntegrations ? "PASS" : "NOT_REQUIRED",
}, null, 2));
