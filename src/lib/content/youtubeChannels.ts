export type HaitiYoutubeChannel = {
  channelId: string;
  sourceName: string;
  focus: string;
};

/** Curated Haiti news / media channels — uploads are fresher than generic search. */
export const haitiYoutubeChannels: HaitiYoutubeChannel[] = [
  {
    channelId: "UC98xnWt1T8nJOaQ8NQAdOjg",
    sourceName: "The Haitian Times",
    focus: "diaspora news, politics, community",
  },
  {
    channelId: "UCWwP6VfG61i7BWSV0H3Jn9A",
    sourceName: "Radio Television Caraïbes",
    focus: "breaking news, talk shows, Haiti daily",
  },
  {
    channelId: "UCnqKf9_wLjDXyhW9EZvodpw",
    sourceName: "RTVC News",
    focus: "news clips, politics, security",
  },
  {
    channelId: "UC_ROp24G0n1W6hqLNEt_CvQ",
    sourceName: "Tele Pam",
    focus: "diaspora, politics, community events",
  },
  {
    channelId: "UCqT3Pk4Gzff041uJhY0FErw",
    sourceName: "Magik9 Haiti",
    focus: "radio panels, sports, politics",
  },
];

export const YOUTUBE_SEARCH_QUERIES = [
  "Haiti news today kreyol",
  "Ayiti nouvèl jodi a",
  "Haitian diaspora news",
  "Grenadye Haiti football",
  "Haiti politics latest",
  "konpa Haiti new video",
  "Haiti viral TikTok reaction",
  "USCIS Haiti update",
  "Haitian immigration lawyer news",
  "Pòtoprens nouvèl",
] as const;
