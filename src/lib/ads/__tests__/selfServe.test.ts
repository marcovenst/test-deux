const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  supabaseAdmin: {
    from: mockFrom,
  },
}));

import {
  countStalePendingSelfServeAdOrders,
  getActiveSelfServeAds,
  markOrderPaid,
} from "@/lib/ads/selfServe";

describe("selfServe domain", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("returns already_active for duplicate payment delivery", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              status: "active",
              duration_days: 5,
              starts_at: "2026-05-01T00:00:00.000Z",
              ends_at: "2026-05-06T00:00:00.000Z",
            },
            error: null,
          }),
        }),
      }),
    });

    const result = await markOrderPaid({
      orderId: "order-1",
      paymentIntentId: "pi_123",
    });

    expect(result.status).toBe("already_active");
    expect(result.startsAt).toBe("2026-05-01T00:00:00.000Z");
    expect(result.endsAt).toBe("2026-05-06T00:00:00.000Z");
    expect(mockFrom).toHaveBeenCalledTimes(1);
  });

  it("activates pending orders with guarded status transition", async () => {
    const transitionGuard = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "order-2",
            starts_at: "2026-05-01T01:00:00.000Z",
            ends_at: "2026-05-06T01:00:00.000Z",
          },
          error: null,
        }),
      }),
    });

    mockFrom
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                status: "pending_payment",
                duration_days: 5,
                starts_at: null,
                ends_at: null,
              },
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: transitionGuard,
          }),
        }),
      });

    const result = await markOrderPaid({
      orderId: "order-2",
      paymentIntentId: "pi_456",
    });

    expect(result.status).toBe("activated");
    expect(transitionGuard).toHaveBeenCalledWith("status", ["pending_payment", "paid"]);
  });

  it("expires old ads before returning active placements", async () => {
    mockFrom
      .mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [
                    {
                      id: "order-3",
                      business_name: "Acme",
                      contact_email: "hello@acme.com",
                      title: "Acme campaign",
                      image_url: "https://example.com/ad.png",
                      target_url: "https://example.com",
                      description: "desc",
                      amount_cents: 500,
                      currency: "usd",
                      status: "active",
                      plan_id: "daily_1",
                      plan_label: "$5 - 1 day",
                      duration_days: 1,
                      starts_at: "2026-05-01T00:00:00.000Z",
                      ends_at: "2099-05-02T00:00:00.000Z",
                      stripe_checkout_session_id: "cs_123",
                      stripe_payment_intent_id: "pi_123",
                      created_at: "2026-05-01T00:00:00.000Z",
                      updated_at: "2026-05-01T00:00:00.000Z",
                    },
                  ],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

    const ads = await getActiveSelfServeAds(3);
    expect(ads).toHaveLength(1);
    expect(ads[0]?.id).toBe("order-3");
    expect(ads[0]?.status).toBe("active");
  });

  it("counts stale pending self-serve orders", async () => {
    mockFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({
            count: 2,
            error: null,
          }),
        }),
      }),
    });

    const count = await countStalePendingSelfServeAdOrders(6);
    expect(count).toBe(2);
  });
});
