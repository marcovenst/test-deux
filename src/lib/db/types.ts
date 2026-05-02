export type Platform = "news" | "reddit" | "youtube" | "twitter" | "web";
export type Sentiment = "positive" | "neutral" | "negative";

export type Engagement = {
  likes: number;
  shares: number;
  comments: number;
  views: number;
};

export type RawPostRow = {
  id: string;
  external_id: string | null;
  title: string;
  content: string;
  snippet: string | null;
  source_name: string;
  source_url: string;
  canonical_url: string | null;
  canonical_url_hash: string | null;
  content_fingerprint: string;
  platform: Platform;
  published_at: string;
  ingested_at: string;
  language: "ht" | "fr" | "en" | string;
  engagement: Engagement;
  raw_metadata: Record<string, unknown>;
  embedding?: number[] | null;
  is_deleted: boolean;
};

export type ClusterRow = {
  id: string;
  title: string | null;
  trend_category: string | null;
  status: "active" | "archived" | string;
  first_seen_at: string;
  last_seen_at: string;
  representative_post_id: string | null;
  centroid_embedding?: number[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ClusterItemRow = {
  id: string;
  cluster_id: string;
  raw_post_id: string;
  similarity_score: number;
  created_at: string;
};

export type TrendScoreRow = {
  id: string;
  cluster_id: string;
  timeframe: "daily" | "weekly";
  trend_score: number;
  frequency_score: number;
  engagement_score: number;
  recency_score: number;
  overlap_bonus: number;
  computed_at: string;
};

export type ClusterSummaryRow = {
  id: string;
  cluster_id: string;
  cluster_title: string;
  summary: string;
  key_points: string[];
  trend_reason: string;
  sentiment: Sentiment;
  tags: string[];
  llm_model: string | null;
  prompt_version: string | null;
  created_at: string;
};

export type SourceRow = {
  id: string;
  name: string;
  platform: Platform;
  base_url: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type IngestionRunRow = {
  id: string;
  source_name: string;
  source_platform: Platform;
  status: "started" | "succeeded" | "failed";
  items_seen: number;
  items_written: number;
  error: string | null;
  started_at: string;
  completed_at: string | null;
};

export type SourceHealthRow = {
  id: string;
  source_name: string;
  source_platform: Platform;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
  avg_latency_ms: number | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type SelfServeAdOrderStatus =
  | "pending_payment"
  | "paid"
  | "active"
  | "cancelled"
  | "expired";

export type SelfServeAdPlanId = "daily_1" | "bundle_5" | "monthly_30";

export type SelfServeAdOrderRow = {
  id: string;
  business_name: string;
  contact_email: string;
  title: string;
  image_url: string;
  target_url: string;
  description: string;
  amount_cents: number;
  currency: string;
  status: SelfServeAdOrderStatus;
  plan_id: SelfServeAdPlanId;
  plan_label: string;
  duration_days: number;
  starts_at: string | null;
  ends_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BillingSubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

export type BillingSubscriptionRow = {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  status: BillingSubscriptionStatus;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_price_id: string | null;
  stripe_latest_event_id: string | null;
  stripe_latest_event_created: string | null;
  created_at: string;
  updated_at: string;
};

export type ClusterViewRow = {
  cluster_id: string;
  total_views: number;
  updated_at: string;
};

export type ClusterPlayMetricRow = {
  cluster_id: string;
  total_plays: number;
  total_play_seconds: number;
  updated_at: string;
};

export type MarketplaceListingStatus =
  | "draft"
  | "pending_posting_payment"
  | "active"
  | "paused"
  | "sold_out";

export type MarketplaceListingRow = {
  id: string;
  seller_name: string;
  seller_email: string;
  seller_phone: string | null;
  title: string;
  description: string;
  price_cents: number;
  shipping_cents: number;
  currency: string;
  image_urls: string[];
  status: MarketplaceListingStatus;
  stripe_posting_checkout_session_id: string | null;
  stripe_posting_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplaceOrderStatus = "pending_payment" | "paid" | "cancelled";

export type MarketplaceOrderRow = {
  id: string;
  listing_id: string;
  buyer_email: string;
  quantity: number;
  item_subtotal_cents: number;
  shipping_cents: number;
  buyer_total_cents: number;
  platform_fee_cents: number;
  currency: string;
  status: MarketplaceOrderStatus;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
};

