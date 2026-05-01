const { getBillingSubscriptionByUserIdMock, checkoutCreateMock } = vi.hoisted(() => ({
  getBillingSubscriptionByUserIdMock: vi.fn(),
  checkoutCreateMock: vi.fn(),
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  getBillingSubscriptionByUserId: getBillingSubscriptionByUserIdMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = {
      sessions: {
        create: checkoutCreateMock,
      },
    };
  },
}));

import { POST } from "@/app/api/billing/checkout/route";

describe("POST /api/billing/checkout", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_SUBSCRIPTION_PRICE_ID: "price_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates subscription checkout session", async () => {
    getBillingSubscriptionByUserIdMock.mockResolvedValue(null);
    checkoutCreateMock.mockResolvedValue({
      id: "cs_1",
      url: "https://checkout.stripe.com/c/pay/cs_1",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
          email: "user@example.com",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.checkoutUrl).toContain("checkout.stripe.com");
    expect(checkoutCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        metadata: { userId: "user_1" },
      }),
    );
  });
});
