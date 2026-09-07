import { supabaseAdminRest } from "@/platform/persistence/supabase-rest";
import {
  getSubscriptionPrice,
  isPlanSlug,
  type BillingInterval,
  type PlanSlug,
} from "./plans";

const STRIPE_API = "https://api.stripe.com/v1";

function stripeSecret() {
  const value = process.env.STRIPE_SECRET_KEY;
  if (!value) throw new Error("STRIPE_SECRET_KEY is not configured.");
  return value;
}

async function stripeForm<T>(path: string, body: URLSearchParams) {
  const response = await fetch(`${STRIPE_API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(data.error?.message ?? "Stripe request failed.");
  }
  return data;
}

async function getOrCreateCustomer(userId: string, email?: string | null) {
  const existing = await supabaseAdminRest<
    Array<{ stripe_customer_id: string }>
  >(
    `billing_customers?user_id=eq.${encodeURIComponent(userId)}&select=stripe_customer_id&limit=1`,
  );
  if (existing[0]?.stripe_customer_id) return existing[0].stripe_customer_id;

  const body = new URLSearchParams();
  if (email) body.set("email", email);
  body.set("metadata[user_id]", userId);
  const customer = await stripeForm<{ id: string }>("/customers", body);

  await supabaseAdminRest("billing_customers?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    }),
  });

  return customer.id;
}

export async function createSubscriptionCheckout(args: {
  userId: string;
  email?: string | null;
  plan: Exclude<PlanSlug, "free">;
  interval: BillingInterval;
  origin: string;
}) {
  const { priceId } = getSubscriptionPrice(args.plan, args.interval);
  const customerId = await getOrCreateCustomer(args.userId, args.email);
  const body = new URLSearchParams();

  body.set("mode", "subscription");
  body.set("customer", customerId);
  body.set("line_items[0][price]", priceId);
  body.set("line_items[0][quantity]", "1");
  body.set(
    "success_url",
    `${args.origin}/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
  );
  body.set("cancel_url", `${args.origin}/billing?checkout=canceled`);
  body.set("metadata[user_id]", args.userId);
  body.set("metadata[plan]", args.plan);
  body.set("metadata[interval]", args.interval);
  body.set("subscription_data[metadata][user_id]", args.userId);
  body.set("subscription_data[metadata][plan]", args.plan);
  body.set("subscription_data[metadata][interval]", args.interval);

  return stripeForm<{ id: string; url?: string | null }>(
    "/checkout/sessions",
    body,
  );
}

export async function createBillingPortal(args: {
  userId: string;
  email?: string | null;
  origin: string;
}) {
  const customerId = await getOrCreateCustomer(args.userId, args.email);
  const body = new URLSearchParams();
  body.set("customer", customerId);
  body.set("return_url", `${args.origin}/billing`);
  return stripeForm<{ id: string; url: string }>(
    "/billing_portal/sessions",
    body,
  );
}

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};

type SubscriptionRecord = {
  user_id: string;
  plan_slug: PlanSlug;
  billing_interval: BillingInterval | null;
};

const statusSet = new Set([
  "trialing",
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "paused",
]);

function unixDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

function stringId(value: unknown) {
  if (typeof value === "string") return value;
  if (
    value
    && typeof value === "object"
    && "id" in value
    && typeof (value as { id?: unknown }).id === "string"
  ) {
    return (value as { id: string }).id;
  }
  return "";
}

function invoiceSubscriptionId(object: Record<string, unknown>) {
  const parent =
    object.parent && typeof object.parent === "object"
      ? (object.parent as Record<string, unknown>)
      : null;
  const subscriptionDetails =
    parent?.subscription_details
    && typeof parent.subscription_details === "object"
      ? (parent.subscription_details as Record<string, unknown>)
      : null;

  // Stripe Basil+ moved invoice.subscription to
  // invoice.parent.subscription_details.subscription. Keep the old field as
  // a compatibility fallback for events created with an older API version.
  return stringId(subscriptionDetails?.subscription) || stringId(object.subscription);
}

async function getSubscriptionByStripeId(subscriptionId: string) {
  const rows = await supabaseAdminRest<SubscriptionRecord[]>(
    `subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}&select=user_id,plan_slug,billing_interval&limit=1`,
  );
  return rows[0] ?? null;
}

export async function hasProcessedStripeEvent(id: string) {
  const rows = await supabaseAdminRest<Array<{ event_id: string }>>(
    `stripe_events?event_id=eq.${encodeURIComponent(id)}&select=event_id&limit=1`,
  );
  return Boolean(rows[0]);
}

export async function recordStripeEvent(id: string, type: string) {
  await supabaseAdminRest("stripe_events?on_conflict=event_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ event_id: id, event_type: type }),
  });
}

export async function reconcileSubscriptionEvent(event: StripeEvent) {
  const object = event.data?.object ?? {};

  if (
    event.type === "checkout.session.completed"
    && object.mode === "subscription"
  ) {
    const metadata =
      object.metadata && typeof object.metadata === "object"
        ? (object.metadata as Record<string, unknown>)
        : {};
    const userId =
      typeof metadata.user_id === "string" ? metadata.user_id : "";
    const plan = metadata.plan;
    const interval = metadata.interval;
    const subscriptionId = stringId(object.subscription);
    const customerId = stringId(object.customer);

    if (
      !userId
      || !subscriptionId
      || !customerId
      || !isPlanSlug(plan)
      || plan === "free"
      || (interval !== "month" && interval !== "year")
    ) {
      return false;
    }

    const paymentStatus = object.payment_status;
    await supabaseAdminRest(
      "subscriptions?on_conflict=stripe_subscription_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          plan_slug: plan,
          billing_interval: interval,
          status:
            paymentStatus === "paid" || paymentStatus === "no_payment_required"
              ? "active"
              : "incomplete",
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return true;
  }

  if (event.type?.startsWith("customer.subscription.")) {
    const subscriptionId = stringId(object.id);
    if (!subscriptionId) return false;

    const existing = await getSubscriptionByStripeId(subscriptionId);
    const metadata =
      object.metadata && typeof object.metadata === "object"
        ? (object.metadata as Record<string, unknown>)
        : {};
    const userId =
      typeof metadata.user_id === "string"
        ? metadata.user_id
        : existing?.user_id;
    const planCandidate =
      typeof metadata.plan === "string"
        ? metadata.plan
        : existing?.plan_slug;
    const intervalCandidate =
      metadata.interval === "month" || metadata.interval === "year"
        ? metadata.interval
        : existing?.billing_interval;

    if (
      !userId
      || !isPlanSlug(planCandidate)
      || planCandidate === "free"
    ) {
      return false;
    }

    const rawStatus =
      typeof object.status === "string" && statusSet.has(object.status)
        ? object.status
        : event.type === "customer.subscription.deleted"
          ? "canceled"
          : "incomplete";
    const customerId = stringId(object.customer) || null;

    await supabaseAdminRest(
      "subscriptions?on_conflict=stripe_subscription_id",
      {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          plan_slug: planCandidate,
          billing_interval: intervalCandidate ?? null,
          status: rawStatus,
          current_period_end: unixDate(object.current_period_end),
          cancel_at_period_end: Boolean(object.cancel_at_period_end),
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return true;
  }

  if (
    event.type === "invoice.paid"
    || event.type === "invoice.payment_failed"
  ) {
    const subscriptionId = invoiceSubscriptionId(object);
    if (!subscriptionId) return false;

    const existing = await getSubscriptionByStripeId(subscriptionId);
    if (!existing) return false;

    await supabaseAdminRest(
      `subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: event.type === "invoice.paid" ? "active" : "past_due",
          updated_at: new Date().toISOString(),
        }),
      },
    );
    return true;
  }

  return false;
}
