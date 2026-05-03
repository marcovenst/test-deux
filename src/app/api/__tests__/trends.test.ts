import { GET } from "@/app/api/trends/route";
import { getTrendFeed } from "@/lib/trends/query";

vi.mock("@/lib/trends/query", () => ({
  getTrendFeed: vi.fn(),
}));

describe("GET /api/trends", () => {
  it("returns timeframe and trend list", async () => {
    vi.mocked(getTrendFeed).mockResolvedValue([
      {
        clusterId: "cluster-1",
        title: "Sample trend",
        summary: "summary",
        trendCategory: "politics",
        trendScore: 92,
        sentiment: "neutral",
        tags: ["politics"],
        sourceCount: 2,
        topSources: [],
      },
    ]);

    const response = await GET(new Request("http://localhost:3000/api/trends?timeframe=weekly"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.timeframe).toBe("weekly");
    expect(json.popularityWindow).toBe("5h");
    expect(json.count).toBe(1);
    expect(json.data[0].clusterId).toBe("cluster-1");
  });
});

