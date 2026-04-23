export type Headline = {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  published: string;
  trendScore: number;
  imageUrl: string;
};

export type ViralTopic = {
  hashtag: string;
  context: string;
  postsPerHour: number;
  trendScore: number;
};

export type VideoSnippet = {
  id: string;
  title: string;
  platform: string;
  duration: string;
  summary: string;
  trendScore: number;
};

export const siteContent = {
  brandName: "Ayiti Buzz Board",
  badge: "Haitian News Intelligence",
  heroTitle: "Everything Haitians are talking about, in one live dashboard.",
  heroDescription:
    "Track breaking Haitian news, viral social clips, and top X conversations in Haitian Creole and diaspora communities, all summarized into fast daily insights.",
  primaryCtaLabel: "View Mega News",
  primaryCtaHref: "#mega-news",
  secondaryCtaLabel: "Watch Viral Videos",
  secondaryCtaHref: "#video-snippets",
  stats: [
    { label: "Stories tracked today", value: "126" },
    { label: "Viral X topics", value: "38" },
    { label: "Video clips monitored", value: "72" },
    { label: "Avg. update interval", value: "15 min" },
  ],
  megaNews: [
    {
      id: "mn-1",
      title: "Diaspora-backed school relief fund trends across Haitian communities",
      summary:
        "Thousands of posts share local school support drives with real-time donation links and on-the-ground updates.",
      category: "Community Impact",
      source: "X + Local Media",
      published: "2h ago",
      trendScore: 94,
      imageUrl: "/news/community-fund.svg",
    },
    {
      id: "mn-2",
      title: "Port-au-Prince transport disruptions spark major safety discussions",
      summary:
        "Viral threads focus on commuter safety, route reliability, and neighborhood-level emergency planning.",
      category: "Public Safety",
      source: "X Threads",
      published: "3h ago",
      trendScore: 88,
      imageUrl: "/news/transport-alert.svg",
    },
    {
      id: "mn-3",
      title: "Haitian creators push cultural storytelling videos into global trends",
      summary:
        "Short-form clips on language, music, and food are generating high engagement and cross-platform shares.",
      category: "Culture",
      source: "TikTok + Instagram + X",
      published: "1h ago",
      trendScore: 91,
      imageUrl: "/news/culture-spotlight.svg",
    },
  ] satisfies Headline[],
  viralXTopics: [
    {
      hashtag: "#AyitiSolidarite",
      context:
        "Mutual aid updates and verified resource threads from Haitian diaspora organizers.",
      postsPerHour: 1250,
      trendScore: 96,
    },
    {
      hashtag: "#KreyolSouX",
      context:
        "Haitian Creole conversations on civic updates, reactions, and community-led explainers.",
      postsPerHour: 980,
      trendScore: 90,
    },
    {
      hashtag: "#HaitiViralVideo",
      context:
        "Fast-moving clip shares with debates about accuracy, context, and source validation.",
      postsPerHour: 820,
      trendScore: 84,
    },
  ] satisfies ViralTopic[],
  videoSnippets: [
    {
      id: "vs-1",
      title: "Street-level update: what locals say about new safety checkpoints",
      platform: "X Video",
      duration: "01:42",
      summary:
        "Short interviews from residents discussing route changes and how neighborhoods are adapting.",
      trendScore: 89,
    },
    {
      id: "vs-2",
      title: "Diaspora recap: top five headlines in Haitian Creole this morning",
      platform: "YouTube Shorts",
      duration: "02:17",
      summary:
        "A daily digest clip summarizing the most discussed Haitian news stories in under three minutes.",
      trendScore: 86,
    },
    {
      id: "vs-3",
      title: "Cultural pulse: Kompa event clip goes viral overnight",
      platform: "Instagram Reels",
      duration: "00:58",
      summary:
        "Music and culture-driven clip now tied to broader identity and diaspora engagement threads.",
      trendScore: 83,
    },
  ] satisfies VideoSnippet[],
  footerNote:
    "Ayiti Buzz Board summarizes public internet content. Always verify important claims with trusted primary sources.",
};
