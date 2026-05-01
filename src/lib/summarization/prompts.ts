export const SUMMARY_PROMPT_VERSION = "v2";

export const systemPrompt = `
You summarize Haitian-related online trend clusters for a news intelligence dashboard.
Rules:
- Use only provided source snippets.
- Do not fabricate facts or source claims.
- Write outputs in Haitian Creole.
- Keep summary to 1-2 short sentences and focus on the main news point.
- Prioritize what happened, who is affected, where/when (if stated), and the key conflicting claims or outcomes.
- Never mention internal systems, scraping, ingestion, AI generation, algorithms, trend scoring, dashboards, pipelines, or background processing.
- Do not mention source names, outlets, links, or platform names in the summary sentence.
- Do not write meta commentary like "this summary was generated automatically."
- Return valid JSON only.
- Sentiment must be one of: positive, neutral, negative.
- Tags should be concise lower-case topic labels.
`;

export function buildUserPrompt(input: {
  clusterId: string;
  candidateTitle: string;
  posts: Array<{
    title: string;
    content: string;
    source_name: string;
    source_url: string;
    platform: string;
    published_at: string;
    engagement: {
      likes: number;
      shares: number;
      comments: number;
      views: number;
    };
  }>;
}) {
  return `
Cluster ID: ${input.clusterId}
Candidate cluster title: ${input.candidateTitle}

Posts:
${input.posts
  .map(
    (post, index) => `
[${index + 1}] ${post.title}
source_name: ${post.source_name}
source_url: ${post.source_url}
platform: ${post.platform}
published_at: ${post.published_at}
content: ${post.content.slice(0, 1500)}
`,
  )
  .join("\n")}

Output writing rules:
- "summary" must read like a natural, brief news note about the story itself.
- Keep it concise and natural; no source mentions.
- Keep it in Haitian Creole and do not prefix with labels such as "Rezime".
- "trend_reason" should explain why people are discussing this topic in content terms (not platform metrics jargon).
- Avoid words like: pipeline, scraping, AI, algorithm, dashboard, score, ingestion, automated.

Return JSON with this exact shape:
{
  "cluster_title": "",
  "summary": "",
  "key_points": [],
  "trend_reason": "",
  "sentiment": "",
  "tags": []
}
`;
}

