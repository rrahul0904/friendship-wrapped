import { afterEach, describe, expect, it, vi } from "vitest";
import { reconcileSubscriptionEvent } from "@/platform/billing/stripe-subscriptions";

function configureSupabase() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://threadtales.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_test";
}

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  delete process.env.SUPABASE_SECRET_KEY;
  vi.unstubAllGlobals();
});

describe("Stripe subscription reconciliation", () => {
  it("marks the current subscription active for a paid Basil invoice", async () => {
    configureSupabase();
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              user_id: "00000000-0000-4000-8000-000000000001",
              plan_slug: "plus",
              billing_interval: "month",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);

    const reconciled = await reconcileSubscriptionEvent({
      id: "evt_invoice_paid",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_test_paid",
          parent: {
            type: "subscription_details",
            subscription_details: { subscription: "sub_test_paid" },
          },
        },
      },
    });

    expect(reconciled).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [patchUrl, patchInit] = fetchSpy.mock.calls[1];
    expect(String(patchUrl)).toContain(
      "/rest/v1/subscriptions?stripe_subscription_id=eq.sub_test_paid",
    );
    expect(patchInit?.method).toBe("PATCH");
    expect(JSON.parse(String(patchInit?.body))).toMatchObject({
      status: "active",
    });
  });

  it("marks the current subscription past_due after invoice payment failure", async () => {
    configureSupabase();
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([
            {
              user_id: "00000000-0000-4000-8000-000000000001",
              plan_slug: "family",
              billing_interval: "year",
            },
          ]),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);

    const reconciled = await reconcileSubscriptionEvent({
      id: "evt_invoice_failed",
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "in_test_failed",
          subscription: "sub_legacy_failed",
        },
      },
    });

    expect(reconciled).toBe(true);
    const [, patchInit] = fetchSpy.mock.calls[1];
    expect(JSON.parse(String(patchInit?.body))).toMatchObject({
      status: "past_due",
    });
  });

  it("ignores unrelated invoices that do not belong to a subscription", async () => {
    configureSupabase();
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const reconciled = await reconcileSubscriptionEvent({
      id: "evt_invoice_unrelated",
      type: "invoice.paid",
      data: { object: { id: "in_one_time" } },
    });

    expect(reconciled).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
