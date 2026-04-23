import { supabaseAdmin } from "@/lib/db/client";
import { getTrendFeed } from "@/lib/trends/query";

type SubscriberNotificationCandidate = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  contact_channel: "email" | "phone";
  notify_realtime: boolean;
  interests: Array<{ category: string; keyword: string | null }>;
};

function matchesInterest(
  trend: {
    trendCategory: string;
    title: string;
    summary: string;
    tags: string[];
  },
  interests: SubscriberNotificationCandidate["interests"],
) {
  const text = `${trend.title} ${trend.summary} ${trend.tags.join(" ")}`.toLowerCase();
  return interests.some((interest) => {
    if (interest.category === "keyword" && interest.keyword) {
      return text.includes(interest.keyword.toLowerCase());
    }
    return trend.trendCategory.toLowerCase() === interest.category.toLowerCase();
  });
}

async function sendEmail(to: string, subject: string, message: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "alerts@zenrezoa.com";
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: message,
    }),
  });
  if (!res.ok) {
    return { ok: false, error: `Resend failed (${res.status})` };
  }
  return { ok: true };
}

async function sendSms(to: string, message: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio credentials missing" };
  }
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: message,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    return { ok: false, error: `Twilio failed (${res.status})` };
  }
  return { ok: true };
}

export async function notifySubscribersForNewStories() {
  const trends = await getTrendFeed("daily", "all", "1h");
  const topTrends = trends.slice(0, 12);

  const { data: subscribers } = await supabaseAdmin
    .from("subscribers")
    .select("id,full_name,email,phone,contact_channel,notify_realtime")
    .eq("is_active", true)
    .eq("notify_realtime", true)
    .limit(500);

  if (!subscribers || subscribers.length === 0) {
    return { checked: 0, queued: 0, sent: 0, failed: 0 };
  }

  let queued = 0;
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers as Array<Omit<SubscriberNotificationCandidate, "interests">>) {
    const { data: interests } = await supabaseAdmin
      .from("subscriber_interests")
      .select("category,keyword")
      .eq("subscriber_id", subscriber.id);
    const fullSubscriber: SubscriberNotificationCandidate = {
      ...subscriber,
      interests: (interests ?? []) as SubscriberNotificationCandidate["interests"],
    };
    const matched = topTrends.find((trend) => matchesInterest(trend, fullSubscriber.interests));
    if (!matched) {
      continue;
    }

    const subject = `Zen Rezo A: ${matched.title}`;
    const body = `${matched.summary}\n\nKategori: ${matched.trendCategory}\nLi plis: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/cluster/${matched.clusterId}`;
    const clusterId = /^[0-9a-f-]{36}$/i.test(matched.clusterId) ? matched.clusterId : null;

    queued += 1;

    let deliveryResult: { ok: boolean; error?: string } = { ok: false, error: "unknown" };
    if (subscriber.contact_channel === "email" && subscriber.email) {
      deliveryResult = await sendEmail(subscriber.email, subject, body);
    } else if (subscriber.contact_channel === "phone" && subscriber.phone) {
      deliveryResult = await sendSms(subscriber.phone, body);
    }

    await supabaseAdmin.from("subscriber_notifications").insert({
      subscriber_id: subscriber.id,
      cluster_id: clusterId,
      channel: subscriber.contact_channel,
      message: body,
      status: deliveryResult.ok ? "sent" : "failed",
      error: deliveryResult.ok ? null : deliveryResult.error ?? "delivery failed",
      sent_at: deliveryResult.ok ? new Date().toISOString() : null,
    });

    if (deliveryResult.ok) {
      sent += 1;
    } else {
      failed += 1;
    }
  }

  return {
    checked: subscribers.length,
    queued,
    sent,
    failed,
  };
}

