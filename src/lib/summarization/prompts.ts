export const SUMMARY_PROMPT_VERSION = "v1";

export const systemPrompt = `
You summarize Haitian-related online trend clusters for a news intelligence dashboard.
Rules:
- Use only provided source snippets.
- Do not fabricate facts or source claims.
- Write outputs mostly in Haitian Creole unless original sources require another language.
- Keep summary to 3-6 sentences.
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
engagement: likes=${post.engagement.likes}, shares=${post.engagement.shares}, comments=${post.engagement.comments}, views=${post.engagement.views}
content: ${post.content.slice(0, 1500)}
`,
  )
  .join("\n")}

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

