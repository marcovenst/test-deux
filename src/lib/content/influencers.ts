export type InfluencerSeed = {
  name: string;
  aliases: string[];
  xHandles: string[];
  youtubeQueries: string[];
  facebookProfiles: string[];
  tiktokProfiles: string[];
  focus: string;
};

export const haitianInfluencers: InfluencerSeed[] = [
  {
    name: "Greg Promo",
    aliases: ["Greg Promo", "Gregory Promo"],
    xHandles: ["gregpromo"],
    youtubeQueries: [
      "Greg Promo Haiti",
      "Greg Promo aktyalite ayiti",
      "Greg Promo showbiz Haiti",
    ],
    facebookProfiles: [
      // Apify facebook-posts-scraper needs page/profile URLs, not /search/ — use scrapable publishers until vanity URLs are known.
      "https://www.facebook.com/HaitianTimes",
    ],
    tiktokProfiles: ["https://www.tiktok.com/search?q=greg%20promo%20haiti"],
    focus: "mizik, showbiz, nouvèl cho",
  },
  {
    name: "Jeanne Douze",
    aliases: ["Jeanne Douze", "Jeanne12"],
    xHandles: ["jeannedouze"],
    youtubeQueries: [
      "Jeanne Douze Haiti",
      "Jeanne Douze diaspora",
      "Jeanne Douze nouvèl ayiti",
    ],
    facebookProfiles: ["https://www.facebook.com/lenouvelliste"],
    tiktokProfiles: ["https://www.tiktok.com/search?q=jeanne%20douze%20haiti"],
    focus: "opinyon, lavi kominote, dyaspora",
  },
  {
    name: "Influansè Ayiti Viral",
    aliases: ["Ayiti Viral", "Haiti Viral"],
    xHandles: [],
    youtubeQueries: [
      "Haiti news kreol viral",
      "Ayiti trend jodi a",
      "Haiti viral video today",
    ],
    facebookProfiles: [
      "https://www.facebook.com/uscis",
    ],
    tiktokProfiles: ["https://www.tiktok.com/search?q=ayiti%20viral%20news"],
    focus: "viral, videyo kout, lavi sosyal",
  },
];

export const fallbackCreoleTrends = [
  {
    title: "Dènye bri sou mizik konpa ap fè anpil pale sou rezo yo",
    summary:
      "Plizyè atis ak fanatik ap diskite sou nouvo klip, rivalite, ak kolaborasyon k ap vini yo. Sijè sa a ap monte fò sou X, YouTube, ak TikTok.",
    trendCategory: "mizik",
    trendScore: 93,
    sentiment: "neutral" as const,
    tags: ["mizik", "kompa", "showbiz", "viral"],
    sourceCount: 3,
  },
  {
    title: "Kominote dyaspora a ap reyaji sou kestyon imigrasyon ak sekirite",
    summary:
      "Moun k ap viv deyò ap pataje eksperyans yo sou nouvo mezi yo, epi yo mande plis enfòmasyon klè pou fanmi yo nan Ayiti.",
    trendCategory: "diaspora",
    trendScore: 90,
    sentiment: "negative" as const,
    tags: ["dyaspora", "imigrasyon", "kominote"],
    sourceCount: 4,
  },
  {
    title: "USCIS ak dosye imigrasyon ayisyen yo ap vin pi cho chak jou",
    summary:
      "Moun yo ap suiv mizajou sou TPS, pwogram imanitè, ak direktiv legal ki soti nan USCIS ansanm ak analiz avoka sou entènèt.",
    trendCategory: "immigration",
    trendScore: 97,
    sentiment: "neutral" as const,
    tags: ["imigrasyon", "uscis", "tps", "avoka"],
    sourceCount: 7,
  },
  {
    title: "Nouvèl ekip nasyonal ayisyen an ap pran dife anvan pwochen match yo",
    summary:
      "Sipòtè yo ap pale anpil sou seleksyon jwè yo, fòm ekip la, ak chans Ayiti genyen nan konpetisyon rejyonal yo.",
    trendCategory: "sports",
    trendScore: 95,
    sentiment: "positive" as const,
    tags: ["espò", "foutbòl", "ekipnasyonal", "grenadye"],
    sourceCount: 6,
  },
  {
    title: "Pwoblèm pri lavi ak transpò nan Pòtoprens tounen gwo sijè",
    summary:
      "Anpil post ak videyo ap montre jan pri manje, gaz, ak transpò ap peze sou popilasyon an. Moun yo ap mande solisyon ijan.",
    trendCategory: "kominote",
    trendScore: 88,
    sentiment: "negative" as const,
    tags: ["ekonomi", "transpò", "lavichè"],
    sourceCount: 5,
  },
  {
    title: "Grenadye yo pare pou defi Brezil la",
    summary: "Analiz taktik, moral ekip la, ak sa fanatik yo atann anvan kòmansman match la.",
    trendCategory: "sports",
    trendScore: 92,
    sentiment: "positive" as const,
    tags: ["espò", "grenadye", "foutbòl"],
    sourceCount: 4,
  },
  {
    title: "Dyaspora ayisyen nan Philadelphia ap chante pou ekip la",
    summary: "Kominote a reyini pou sipòte Grenadye yo epi pataje emosyon an dirèk sou rezo yo.",
    trendCategory: "diaspora",
    trendScore: 86,
    sentiment: "positive" as const,
    tags: ["dyaspora", "kominote", "espò"],
    sourceCount: 3,
  },
  {
    title: "Match Ayiti vs Brezil ap fè bri sou entènèt",
    summary: "Videyo reyaksyon, analiz, ak stream k ap fè wout sou YouTube ak Facebook.",
    trendCategory: "viral",
    trendScore: 94,
    sentiment: "neutral" as const,
    tags: ["viral", "espò", "videyo"],
    sourceCount: 5,
  },
  {
    title: "Medya ayisyen ap debat sou chans ekip nasyonal la",
    summary: "Panel radyo ak televizyon ap diskite sou fòs ekip la ak estrateji pou match la.",
    trendCategory: "politics",
    trendScore: 84,
    sentiment: "neutral" as const,
    tags: ["medya", "politik", "espò"],
    sourceCount: 4,
  },
  {
    title: "Reyaksyon anbasadè Brezil la sou match Ayiti",
    summary: "Diplomatik ak medya lokal ap kòmantè sou enpak match la pou relasyon de peyi yo.",
    trendCategory: "politics",
    trendScore: 81,
    sentiment: "neutral" as const,
    tags: ["politik", "diplomasi"],
    sourceCount: 3,
  },
  {
    title: "Nouvèl kilti ak mizik ayisyen ki ap monte sou rezo",
    summary: "Nouvo pèfòmans, konpa, ak kreyasyon atis k ap atire atansyon sou YouTube.",
    trendCategory: "mizik",
    trendScore: 79,
    sentiment: "positive" as const,
    tags: ["mizik", "kilti"],
    sourceCount: 2,
  },
  {
    title: "Diskisyon sou sekirite ak stabilite nan kapital la",
    summary: "Sitiyasyon jounen an ap domine kòmantè sou radyo ak paj nouvèl yo.",
    trendCategory: "kominote",
    trendScore: 77,
    sentiment: "negative" as const,
    tags: ["sekirite", "pòtoprens"],
    sourceCount: 3,
  },
];

export const sportsHubTopics = [
  {
    title: "Grenadye yo: dènye nouvèl sou lis jwè yo",
    snippet:
      "Fanmiy foutbòl ayisyen an ap suiv tout nouvèl sou seleksyon, blesi, ak nouvo jwè dyaspora yo.",
  },
  {
    title: "Road to World Cup / Gold Cup pou Ayiti",
    snippet:
      "Fanatik yo ap analize kalandriye match yo, taktik ekip la, epi evalye nivo advèsè yo nan zòn CONCACAF.",
  },
  {
    title: "Performans jwè ayisyen aletranje",
    snippet:
      "Anpil paj espò ap montre kijan jwè ayisyen yo ap briye nan lig Ewòp, Etazini, ak Karayib la.",
  },
];

export const immigrationHubTopics = [
  {
    title: "Mizajou USCIS sou dosye ayisyen yo",
    snippet:
      "Rezime sou dènye nòt ofisyèl, chanjman pwosedi, ak dat enpòtan ki soti sou paj USCIS ak sous leta.",
    sourceHint: "USCIS / sit ofisyèl",
  },
  {
    title: "Sa avoka imigrasyon yo ap eksplike semèn nan",
    snippet:
      "Pwen kle avoka yo mete devan sou TPS, parol, renouvèlman dosye, ak fason pou prepare dokiman yo san erè.",
    sourceHint: "Avoka imigrasyon / atik legal",
  },
  {
    title: "Reyaksyon kominote ayisyen sou nouvo mezi yo",
    snippet:
      "Deba sou rezo sosyal ak nan dyaspora a sou sa ki chanje, kiyès sa afekte, ak etap moun yo dwe pran kounye a.",
    sourceHint: "Atik + sosyal + dyaspora",
  },
];

