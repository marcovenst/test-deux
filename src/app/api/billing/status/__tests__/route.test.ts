const { getBillingStatusMock } = vi.hoisted(() => ({
  getBillingStatusMock: vi.fn(),
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  getBillingStatus: getBillingStatusMock,
}));

import { GET } from "@/app/api/billing/status/route";

describe("GET /api/billing/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns billing status for userId query param", async () => {
    getBillingStatusMock.mockResolvedValue({
      userId: "user_1",
      hasActiveSubscription: true,
      status: "active",
      currentPeriodEnd: "2026-06-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    });

    const response = await GET(
      new Request("http://localhost:3000/api/billing/status?userId=user_1"),
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.hasActiveSubscription).toBe(true);
  });
});
