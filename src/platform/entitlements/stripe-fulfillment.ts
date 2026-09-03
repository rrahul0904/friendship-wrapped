import { supabaseAdminRest } from "@/platform/persistence/supabase-rest";
import { isSupabaseServerConfigured } from "@/platform/persistence/config";

const PREMIUM_PRODUCT = "threadtales-premium";

type StripeCheckoutCompletedEvent = {
  type?: unknown;
  data?: {
    object?: {
      id?: unknown;
      payment_status?: unknown;
      metadata?: unknown;
    };
  };
};

function isCompletedPremiumCheckout(event: StripeCheckoutCompletedEvent) {
  const checkout = event.data?.object;
  return event.type === "checkout.session.completed"
    && typeof checkout?.id === "string"
    && /^cs_(?:test_|live_)?[A-Za-z0-9_]+$/.test(checkout.id)
    && checkout.payment_status === "paid"
    && typeof checkout.metadata === "object"
    && checkout.metadata !== null
    && (checkout.metadata as Record<string, unknown>).entitlement === PREMIUM_PRODUCT;
}

/**
 * Records a verified, paid checkout using its Stripe session id as an idempotency
 * key. This intentionally persists no customer profile, email, or raw webhook
 * payload: Stripe remains the payment record of truth.
 */
export async function fulfillVerifiedStripeWebhook(event: StripeCheckoutCompletedEvent) {
  if (!isCompletedPremiumCheckout(event)) return { fulfilled: false, persisted: false };

  if (!isSupabaseServerConfigured()) return { fulfilled: true, persisted: false };

  const checkout = event.data!.object!;
  await supabaseAdminRest("entitlements?on_conflict=provider%2Cprovider_reference", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: null,
      product: PREMIUM_PRODUCT,
      provider: "stripe",
      provider_reference: checkout.id,
      status: "active",
      expires_at: null,
    }),
  });

  return { fulfilled: true, persisted: true };
}
