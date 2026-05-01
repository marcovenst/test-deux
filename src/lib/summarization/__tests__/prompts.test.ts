import { buildUserPrompt, SUMMARY_PROMPT_VERSION, systemPrompt } from "@/lib/summarization/prompts";

describe("summarization prompts", () => {
  it("uses v2 prompt version", () => {
    expect(SUMMARY_PROMPT_VERSION).toBe("v2");
  });

  it("enforces content-first summary instructions", () => {
    expect(systemPrompt).toContain("Never mention internal systems");
    expect(systemPrompt).toContain("focus on the main news point");
    expect(systemPrompt).toContain("Write outputs in Haitian Creole");
    expect(systemPrompt).toContain("Do not mention source names");
  });

  it("buildUserPrompt excludes engagement metrics and includes anti-meta rules", () => {
    const prompt = buildUserPrompt({
      clusterId: "cluster-1",
      candidateTitle: "Dosye enpòtan",
      posts: [
        {
          title: "Tit atik",
          content: "Kontni atik la sou dosye aktyalite a.",
          source_name: "Source",
          source_url: "https://example.com",
          platform: "web",
          published_at: "2026-05-01T00:00:00.000Z",
          engagement: {
            likes: 10,
            shares: 4,
            comments: 2,
            views: 100,
          },
        },
      ],
    });

    expect(prompt).not.toContain("engagement:");
    expect(prompt).toContain("Output writing rules:");
    expect(prompt).toContain("Avoid words like: pipeline, scraping, AI");
    expect(prompt).toContain('do not prefix with labels such as "Rezime"');
  });
});
