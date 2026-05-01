const { getBillingSubscriptionByUserIdMock, portalCreateMock } = vi.hoisted(() => ({
  getBillingSubscriptionByUserIdMock: vi.fn(),
  portalCreateMock: vi.fn(),
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  getBillingSubscriptionByUserId: getBillingSubscriptionByUserIdMock,
}));

vi.mock("stripe", () => ({
  default: class StripeMock {
    billingPortal = {
      sessions: {
        create: portalCreateMock,
      },
    };
  },
}));

import { POST } from "@/app/api/billing/portal/route";

describe("POST /api/billing/portal", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates billing portal session for known customer", async () => {
    getBillingSubscriptionByUserIdMock.mockResolvedValue({
      stripeCustomerId: "cus_1",
    });
    portalCreateMock.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/billing/portal", {
        method: "POST",
        body: JSON.stringify({
          userId: "user_1",
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.portalUrl).toContain("billing.stripe.com");
    expect(portalCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_1",
      }),
    );
  });
});
