const { markOrderPaidMock, headersMock, constructEventMock } = vi.hoisted(() => ({
  markOrderPaidMock: vi.fn(),
  headersMock: vi.fn(),
  constructEventMock: vi.fn(),
}));

vi.mock("@/lib/ads/selfServe", () => ({
  markOrderPaid: markOrderPaidMock,
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: constructEventMock,
    };
  },
}));

import { POST } from "@/app/api/ads/self-serve/webhook/route";

describe("POST /api/ads/self-serve/webhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_123",
    };
    headersMock.mockResolvedValue(
      new Headers({
        "stripe-signature": "sig_123",
      }),
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns 400 when checkout session metadata is missing adOrderId", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          metadata: {},
          payment_intent: "pi_1",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/ads/self-serve/webhook", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);
    expect(markOrderPaidMock).not.toHaveBeenCalled();
  });

  it("handles duplicate webhook delivery idempotently", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          metadata: {
            adOrderId: "order_2",
          },
          payment_intent: "pi_2",
        },
      },
    });
    markOrderPaidMock.mockResolvedValue({
      orderId: "order_2",
      status: "already_active",
      startsAt: "2026-05-01T00:00:00.000Z",
      endsAt: "2026-05-06T00:00:00.000Z",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/ads/self-serve/webhook", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.activationStatus).toBe("already_active");
    expect(markOrderPaidMock).toHaveBeenCalledWith({
      orderId: "order_2",
      paymentIntentId: "pi_2",
    });
  });
});
