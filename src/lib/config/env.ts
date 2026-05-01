import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  APIFY_TOKEN: z.string().min(1).optional(),
  APIFY_ACTOR_ID: z.string().min(1).optional(),
  APIFY_FACEBOOK_ACTOR_ID: z.string().min(1).optional(),
  APIFY_INSTAGRAM_ACTOR_ID: z.string().min(1).optional(),
  APIFY_TIKTOK_ACTOR_ID: z.string().min(1).optional(),
  REDDIT_CLIENT_ID: z.string().min(1).optional(),
  REDDIT_CLIENT_SECRET: z.string().min(1).optional(),
  REDDIT_USER_AGENT: z.string().min(1).default("ayiti-buzz-board/1.0"),
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
  UPSTASH_QSTASH_TOKEN: z.string().min(1).optional(),
  INGESTION_SHARED_SECRET: z.string().min(1),
  ADMIN_DASHBOARD_TOKEN: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().min(1).optional(),
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  TWILIO_FROM_NUMBER: z.string().min(1).optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function isConfigured(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return !(
    normalized.includes("your-") ||
    normalized.includes("replace-with") ||
    normalized.includes("placeholder") ||
    normalized.includes("xxxxxxxx")
  );
}

