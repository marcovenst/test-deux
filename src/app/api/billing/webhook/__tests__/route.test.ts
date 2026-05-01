const { headersMock, constructEventMock, syncCheckoutMock, syncSubscriptionMock, markFailedMock } =
  vi.hoisted(() => ({
    headersMock: vi.fn(),
    constructEventMock: vi.fn(),
    syncCheckoutMock: vi.fn(),
    syncSubscriptionMock: vi.fn(),
    markFailedMock: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  syncBillingFromCheckoutSession: syncCheckoutMock,
  syncBillingFromSubscriptionObject: syncSubscriptionMock,
  markBillingPaymentFailed: markFailedMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = {
      constructEvent: constructEventMock,
    };
  },
}));

import { POST } from "@/app/api/billing/webhook/route";

describe("POST /api/billing/webhook", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_BILLING_WEBHOOK_SECRET: "whsec_test",
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

  it("processes checkout.session.completed for subscription mode", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_1",
      created: 1746057600,
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          metadata: { userId: "user_1" },
          customer: "cus_1",
          subscription: "sub_1",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(200);
    expect(syncCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user_1",
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
      }),
    );
  });

  it("marks invoice.payment_failed as past_due input", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_2",
      created: 1746057600,
      type: "invoice.payment_failed",
      data: {
        object: {
          customer: "cus_2",
          subscription: "sub_2",
        },
      },
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/webhook", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(200);
    expect(markFailedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeCustomerId: "cus_2",
        stripeSubscriptionId: "sub_2",
      }),
    );
  });
});
