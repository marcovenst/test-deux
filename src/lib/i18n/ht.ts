import { categoryLabelsFromConfigHt } from "@/lib/trends/categories";

/**
 * Haitian Creole copy dictionary for manual edits.
 * Update any labels/messages here to change UI translation.
 */
export const htCopy = {
  brandName: "Zen Rezo A",
  tagLine: "Tout sa k ap fè bri nan kominote ayisyen an",
  liveLabel: "Live",
  searchCta: "Chèche",
  archiveCta: "Achiv",
  haitiSignatureLabel: "Rasin Ayiti",
  haitiSignatureText: "Nouvèl ak vwa kominote ayisyen an, an premye.",
  heroBadge: "Nouvèl cho jounen an",
  heroTitle:
    "Aktyalite Lakay: Imigrasyon, Espò, Mizik, Dyaspora, Kilti, Politik, ak tout sa k ap fè bri nan kominote ayisyen an.",
  heroSubtitle:
    "Nou mete sijè ki cho yo devan, ak snippets klè pou w ka deside si w vle klike sou sous orijinal la.",
  megaTrendLabel: "Mega tandans",
  dailyDigestBadge: "Rezime nouvèl",
  dailyDigestTitleDaily: "Gwo istwa jounen an",
  dailyDigestTitleWeekly: "Gwo istwa semèn nan",
  dailyDigestIntroDaily:
    "Men yon rezime an pwen sou pi gwo istwa k ap fè bri jodi a nan kominote ayisyen an — soti nan imigrasyon ak espò rive nan mizik, politik, ak sa k ap viral sou rezo yo.",
  dailyDigestIntroWeekly:
    "Men yon rezime an pwen sou pi gwo istwa ki te domine semèn nan pou kominote ayisyen an, ak kèk mo klè sou sa k ap pase.",
  dailyDigestUpdated: "Dènye mizajou:",
  dailyDigestViews: "Kantite moun ki li istwa sa a",
  dailyDigestReadMore: "Li plis sou istwa sa a",
  trendScoreLabel: "Nivo tandans",
  noData:
    "Pa gen done ap viv ankò. Lanse pipeline ingestion la pou chaje done yo epi wè tandans yo.",
  weeklyProgramTitle: "Pwogram semèn nan",
  weeklyProgramSubtitle:
    "Evenman k ap vini nan kominote a — verifye dat ak tikè sou sit òganizatè a anvan w sòti.",
  weeklyProgramSourcesIntro: "Sous nap agrège:",
  weeklyProgramEmpty:
    "Pa gen evenman nan kalandriye a kounye a. Aplike migrasyon 0011_community_events.sql, epi ajoute evenman nan Supabase oswa kouri supabase/seeds/community_events_sample.sql.",
  weeklyProgramExternalCta: "Detay · tikè",
  sportsHubTitle: "Work Hub Espò",
  sportsHubSubtitle:
    "Fokus sou ekip nasyonal Ayiti a, foutbòl, ak gwo nouvèl espò kominote a.",
  immigrationHubTitle: "Work Hub Imigrasyon",
  immigrationHubSubtitle:
    "USCIS, avoka imigrasyon, ak atik serye sou TPS, pwogram legal, ak mizajou pou ayisyen yo.",
  categoryTitle: "Kategori k ap pete",
  footerNote:
    "Zen Rezo A rasanble sous piblik yo sèlman. Toujou verifye enfòmasyon enpòtan yo ak sous ofisyèl.",
  newsCardLabel: "Nouvèl",
  newsCardReadFull: "Li tout istwa a",
  newsCardSources: "Sous",
  videoFeedTitle: "Videyo k ap fè bri",
  articleFeedTitle: "Nouvèl",
  videoFeedEmpty: "Pa gen videyo nan batch sa a ankò. Lè baz done a rekonekte, klip YouTube ak rezo sosyal yo ap parèt isit la.",
  feedFallbackTitle: "Done ap viv yo poko chaje",
  feedFallbackBody:
    "Sit la montre egzanp pou kounye a paske li pa ka konekte ak baz done Supabase a. Verifye SUPABASE_URL ak SUPABASE_SERVICE_ROLE_KEY sou Vercel, epi relanse pipeline ingestion la.",
  feedHourlyNote: "Nouvo istwa antre chak èdtan lè ingestion la ap mache.",
  summaryListenTitle: "Résumé vocal",
  summaryListenCtaPlay: "Koute",
  summaryListenCtaPause: "Kanpe",
  summaryListenHint:
    "Lè pa gen videyo, ou ka koute rezime a nan Kreyòl oswa vwa ki pi pre (selon navigatè w).",
  summaryListenUnsupported:
    "Navigatè a pa pèmèt lekti vwa. Li tèks rezime anba a.",
  cardSourceCta: "Li sous la",
  archiveBlurb:
    "Tout sijè yo rete sou sit la menm lè yo pa sou premye paj la ankò. Vizite achiv la pou jwenn ansyen nouvèl yo.",
  footerRights: "© 2026 Zen Rezo A. Tout dwa rezève.",
  footerContactLead: "Pou plis enfòmasyon:",
  footerContactEmail: "hello@zenlakay.com",
  footerPrivacy: "Konfidansyalite / Privacy",
};

/** Labels for the weekly program sidebar (data sources roadmap). */
export const weeklyProgramSourcePills = [
  "Eventbrite",
  "Ticketmaster",
  "Konpa Events",
  "Randevou-a",
] as const;

export const shopLaCailleCopy = {
  navCta: "Shop Lakay : Marketplace",
  /** Stacked label on small phones (same meaning as navCta) */
  navCtaMobilePrimary: "Shop Lakay",
  navCtaMobileSecondary: "Marketplace",
  title: "Shop Lakay : Marketplace",
  subtitle:
    "Achte ak vann nan yon espas dedye a kominote a. Peze Achte pou achte oswa Vann pou mete atik ou.",
  achteLabel: "Achte",
  achteHint: "Wè atik ki disponib yo",
  vannLabel: "Vann",
  vannHint: "Mete pwodwi ou an vant",
  emptyAchte: "Pa gen atik aktif kounye a. Tounen pita oswa vin vann yon bagay!",
  achteLoadErrorTitle: "Erè lè nap chaje katalòg la",
  listingImagePlaceholder: "San foto",
  badgeCommunityListing: "Kominoté",
  badgeCatalogOnPlatform: "Katalòg platfòm — achte isit",
  badgeCatalogAffiliate: "Patnè / afilye — lyen ekstèn",
  catalogVisitPartnerCta: "Achete kote patnè a (lyen afilye)",
  catalogAffiliateStripeNote:
    "Pou ofr sa a, ou achte sou sit patnè a. Komisyon afilye an jeneral peye pa rezo patnè a (pa egzanp Amazon), pa dirèkteman atravè kont Stripe nou an.",
  vannPhotosDragHint:
    "Glise-lage foto atik la isit, oswa klike pou chwazi. JPEG, PNG, WebP oswa GIF — 1 a 8 foto, chak jiska 5 Mo.",
  backShop: "Retounen Shop Lakay : Marketplace",
  postingFeeBanner:
    "Kreye yon kont. Lè yon moun achte, lajan nèt ou (pri atik + transpò) antre nan kont ou. Achtè a peye frè platfòm 7% anplis. Ou ka mande Cashout lè balans ou pare (min. $20); ekip la peye w via Zelle, ACH oswa kat dapre demann ou.",
  sellTitle: "Mete atik ou",
  sellerName: "Non konplè",
  sellerEmail: "Imèl",
  sellerPhone: "Telefòn (opsyonel)",
  productTitle: "Tit atik la",
  description: "Deskripsyon",
  priceUsd: "Pri (USD)",
  shippingUsd: "Frè transpò (USD)",
  imagesLabel: "Foto yo (1–8 imaj)",
  submit: "Pibliye atik la",
  checkoutLoading: "Chaje…",
  buyTitle: "Achte",
  buyerEmail: "Imèl ou pou acha a",
  payButton: "Peye sou Stripe",
  orderSuccess:
    "Atik ou an aktif! Sove lyen kont vann ou — li montre balans ou ak kachout. Pa pataje lyen sa a.",
  orderCancel: "Peman anile.",
  uploadFailed: "Upload echwe. Eseye ankò.",
  sellerDashboardTitle: "Kont vann",
  sellerDashboardExplain:
    "Balans ou montre lajan ki rete apre lavant yo, epi sa ki bloke nan demann Cashout ki an tan. Lè ou mande Cashout, ekip la peye ou (voye lajan ba ou) atravè Zelle, ACH (depo bank) oswa peman sou kat debi, selon opsyon ou chwazi nan demann an.",
  sellerBalanceLabel: "Balans total",
  sellerReservedLabel: "An tann kachout",
  sellerAvailableLabel: "Disponib pou kachout",
  sellerHistoryTitle: "Istorik",
  sellerHistoryEmpty: "Poko gen tranzaksyon.",
  sellerLedgerSale: "Lavant",
  sellerLedgerPayout: "Kachout",
  sellerPayoutRequestsTitle: "Demann kachout",
  sellerPayoutsEmpty: "Pa gen demann.",
  sellerPayoutTitle: "Mande kachout",
  sellerPayoutDisclaimer:
    "Chwazi kijan ou vle ekip la peye w: Zelle, depo ACH nan bank ou, oswa peman sou kat debi. Ranpli enfòmasyon an ak anpil atansyon; transfè a fèt manyèlman apre verifikasyon. (Peye otomatik konplè mande Stripe Connect — nou ka ajoute sa pita.)",
  sellerPayoutAmount: "Montan (USD)",
  sellerPayoutMethod: "Mòd peman",
  sellerPayoutZelle: "Zelle",
  sellerPayoutAch: "Depo dirèk (ACH / bank)",
  sellerPayoutDebit: "Peman kat debi (debit card)",
  sellerPayoutZelleField: "Imèl oswa telefòn Zelle",
  sellerPayoutAchName: "Non sou kont la",
  sellerPayoutAchBank: "Non bank",
  sellerPayoutAchLast4: "4 dènye chif kont",
  sellerPayoutCardName: "Non sou kat la",
  sellerPayoutCardLast4: "4 dènye chif kat",
  sellerPayoutSubmit: "Voye demann",
  sellerPayoutInvalidAmount: "Antre yon montan valab.",
  sellerPayoutMin: "Minimum se $MIN.",
  sellerPayoutTooMuch: "Montan an pi gwo pase balans disponib.",
  sellerPayoutZelleRequired: "Antre adrès Zelle ou.",
  sellerPayoutAchRequired: "Ranpli tout chan bank la.",
  sellerPayoutCardRequired: "Ranpli non ak 4 dènye chif kat la.",
  sellerPayoutBelowMin: "Balans disponib pi piti pase minimum kachout ($MIN).",
  sellerPayoutSubmitted:
    "Demann ou anrejistre. Ekip la ap revize e trete transfè a. W ap wè yon antre nan istorik la.",
  sellerPayoutAdminNote:
    "Minimum kachout: $MIN. Apre transfè reyisi, administaratè ka make demann kòm peye nan API entènk.",
  sellerSaveLinkWarning:
    "Sove prive lyen paj sa a. Si ou pèdi l, ekri sipò ak imèl kont ou; nou pral verifye idantite w.",
};

export const categoryLabelsHt: Record<string, string> = categoryLabelsFromConfigHt;

