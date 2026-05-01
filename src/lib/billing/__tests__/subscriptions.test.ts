const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

import {
  getBillingStatus,
  markBillingPaymentFailed,
  subscriptionHasEntitlement,
  syncBillingFromSubscriptionObject,
} from "@/lib/billing/subscriptions";

describe("billing subscriptions domain", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("resolves no entitlement when user has no billing record", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      }),
    });

    const status = await getBillingStatus("user-1");
    expect(status.hasActiveSubscription).toBe(false);
    expect(status.status).toBe("none");
  });

  it("maps active/trialing statuses to entitlement", () => {
    expect(subscriptionHasEntitlement("active")).toBe(true);
    expect(subscriptionHasEntitlement("trialing")).toBe(true);
    expect(subscriptionHasEntitlement("past_due")).toBe(false);
  });

  it("syncs subscription updates using existing user mapping", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "row-1",
                user_id: "user-1",
                stripe_customer_id: "cus_1",
                stripe_subscription_id: "sub_1",
                status: "incomplete",
                current_period_end: null,
                cancel_at_period_end: false,
                stripe_price_id: null,
                stripe_latest_event_id: null,
                stripe_latest_event_created: null,
                created_at: "2026-05-01T00:00:00.000Z",
                updated_at: "2026-05-01T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "row-1",
                user_id: "user-1",
                stripe_customer_id: "cus_1",
                stripe_subscription_id: "sub_1",
                status: "active",
                current_period_end: "2026-06-01T00:00:00.000Z",
                cancel_at_period_end: false,
                stripe_price_id: "price_1",
                stripe_latest_event_id: "evt_1",
                stripe_latest_event_created: "2026-05-01T00:00:00.000Z",
                created_at: "2026-05-01T00:00:00.000Z",
                updated_at: "2026-05-01T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      });

    const result = await syncBillingFromSubscriptionObject({
      subscription: {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        current_period_end: 1780272000,
        cancel_at_period_end: false,
        metadata: {},
        items: {
          data: [{ price: { id: "price_1" } }],
        },
      } as never,
      stripeEventId: "evt_1",
      stripeEventCreated: 1746057600,
    });

    expect(result.status).toBe("active");
    expect(result.userId).toBe("user-1");
  });

  it("marks payment_failed as past_due", async () => {
    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: "row-2",
                user_id: "user-2",
                stripe_customer_id: "cus_2",
                stripe_subscription_id: "sub_2",
                status: "active",
                current_period_end: "2026-06-01T00:00:00.000Z",
                cancel_at_period_end: false,
                stripe_price_id: "price_2",
                stripe_latest_event_id: null,
                stripe_latest_event_created: null,
                created_at: "2026-05-01T00:00:00.000Z",
                updated_at: "2026-05-01T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "row-2",
                user_id: "user-2",
                stripe_customer_id: "cus_2",
                stripe_subscription_id: "sub_2",
                status: "past_due",
                current_period_end: "2026-06-01T00:00:00.000Z",
                cancel_at_period_end: false,
                stripe_price_id: "price_2",
                stripe_latest_event_id: "evt_2",
                stripe_latest_event_created: "2026-05-02T00:00:00.000Z",
                created_at: "2026-05-01T00:00:00.000Z",
                updated_at: "2026-05-02T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        }),
      });

    const result = await markBillingPaymentFailed({
      stripeCustomerId: "cus_2",
      stripeSubscriptionId: "sub_2",
      stripeEventId: "evt_2",
      stripeEventCreated: 1746144000,
    });

    expect(result.status).toBe("past_due");
  });
});
