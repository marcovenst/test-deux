const { ensureActiveSubscriptionMock } = vi.hoisted(() => ({
  ensureActiveSubscriptionMock: vi.fn(),
}));

vi.mock("@/lib/billing/subscriptions", () => ({
  ensureActiveSubscription: ensureActiveSubscriptionMock,
}));

import { GET } from "@/app/api/member/content/route";

describe("GET /api/member/content", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 402 when subscription is inactive", async () => {
    ensureActiveSubscriptionMock.mockResolvedValue(false);
    const response = await GET(
      new Request("http://localhost:3000/api/member/content", {
        headers: {
          "x-user-id": "user_1",
        },
      }),
    );
    expect(response.status).toBe(402);
  });

  it("returns member content when subscription is active", async () => {
    ensureActiveSubscriptionMock.mockResolvedValue(true);
    const response = await GET(
      new Request("http://localhost:3000/api/member/content", {
        headers: {
          "x-user-id": "user_1",
        },
      }),
    );
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
  });
});
