import { supabaseAdmin } from "@/lib/db/client";
import type { SelfServeAdOrderRow } from "@/lib/db/types";

export type SelfServeAdOrderStatus = "pending_payment" | "paid" | "active" | "cancelled" | "expired";
export type SelfServeAdPlanId = "daily_1" | "bundle_5" | "monthly_30";
export type MarkOrderPaidResult = {
  orderId: string;
  status: "activated" | "already_active";
  startsAt: string;
  endsAt: string;
};

export type SelfServeAdPlan = {
  id: SelfServeAdPlanId;
  label: string;
  amountCents: number;
  durationDays: number;
};

const SELF_SERVE_AD_PLANS: SelfServeAdPlan[] = [
  {
    id: "daily_1",
    label: "$5 - 1 day",
    amountCents: 500,
    durationDays: 1,
  },
  {
    id: "bundle_5",
    label: "$20 - 5 days",
    amountCents: 2000,
    durationDays: 5,
  },
  {
    id: "monthly_30",
    label: "$50 - 30 days",
    amountCents: 5000,
    durationDays: 30,
  },
];

export type SelfServeAdOrder = {
  id: string;
  createdAt: string;
  updatedAt: string;
  businessName: string;
  contactEmail: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  description: string;
  amountCents: number;
  currency: string;
  status: SelfServeAdOrderStatus;
  planId: SelfServeAdPlanId;
  planLabel: string;
  durationDays: number;
  startsAt: string | null;
  endsAt: string | null;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
};

type CreateSelfServeAdOrderInput = {
  businessName: string;
  contactEmail: string;
  title: string;
  imageUrl: string;
  targetUrl: string;
  description: string;
  planId: SelfServeAdPlanId;
};

function computeEndDate(startsAt: string, days: number) {
  const start = new Date(startsAt);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

function fromRow(row: SelfServeAdOrderRow): SelfServeAdOrder {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    businessName: row.business_name,
    contactEmail: row.contact_email,
    title: row.title,
    imageUrl: row.image_url,
    targetUrl: row.target_url,
    description: row.description,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    planId: row.plan_id,
    planLabel: row.plan_label,
    durationDays: row.duration_days,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? undefined,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? undefined,
  };
}

export async function createSelfServeAdOrder(input: CreateSelfServeAdOrderInput) {
  const selectedPlan = getSelfServeAdPlan(input.planId);
  if (!selectedPlan) {
    throw new Error("Invalid self-serve ad plan");
  }
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .insert({
      business_name: input.businessName,
      contact_email: input.contactEmail,
      title: input.title,
      image_url: input.imageUrl,
      target_url: input.targetUrl,
      description: input.description,
      amount_cents: selectedPlan.amountCents,
      currency: "usd",
      status: "pending_payment",
      plan_id: selectedPlan.id,
      plan_label: selectedPlan.label,
      duration_days: selectedPlan.durationDays,
      starts_at: null,
      ends_at: null,
      updated_at: now,
    })
    .select(
      "id,business_name,contact_email,title,image_url,target_url,description,amount_cents,currency,status,plan_id,plan_label,duration_days,starts_at,ends_at,stripe_checkout_session_id,stripe_payment_intent_id,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create self-serve ad order");
  }

  return fromRow(data as SelfServeAdOrderRow);
}

export async function attachCheckoutSession(orderId: string, checkoutSessionId: string) {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .update({
      stripe_checkout_session_id: checkoutSessionId,
      updated_at: now,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function markOrderPaid(input: {
  orderId: string;
  paymentIntentId?: string;
}): Promise<MarkOrderPaidResult> {
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .select("status,duration_days,starts_at,ends_at")
    .eq("id", input.orderId)
    .single();
  if (existingError || !existing) {
    throw new Error(existingError?.message ?? "Ad order not found");
  }

  const existingStatus = existing.status as SelfServeAdOrderStatus;
  if (existingStatus === "active" && existing.starts_at && existing.ends_at) {
    return {
      orderId: input.orderId,
      status: "already_active",
      startsAt: existing.starts_at,
      endsAt: existing.ends_at,
    };
  }

  if (existingStatus === "cancelled" || existingStatus === "expired") {
    throw new Error(`Cannot activate ad order with status "${existingStatus}"`);
  }

  const startsAt = existing.starts_at ?? now;
  const endsAt = existing.ends_at ?? computeEndDate(startsAt, Number(existing.duration_days));
  const { data: updated, error } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .update({
      status: "active",
      starts_at: startsAt,
      ends_at: endsAt,
      stripe_payment_intent_id: input.paymentIntentId ?? null,
      updated_at: now,
    })
    .eq("id", input.orderId)
    .in("status", ["pending_payment", "paid"])
    .select("id,starts_at,ends_at")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!updated) {
    const { data: current, error: currentError } = await supabaseAdmin
      .from("self_serve_ad_orders")
      .select("status,starts_at,ends_at")
      .eq("id", input.orderId)
      .single();
    if (currentError || !current) {
      throw new Error(currentError?.message ?? "Ad order not found");
    }

    if (current.status === "active" && current.starts_at && current.ends_at) {
      return {
        orderId: input.orderId,
        status: "already_active",
        startsAt: current.starts_at,
        endsAt: current.ends_at,
      };
    }

    throw new Error(`Unexpected ad order status "${current.status}" while processing payment`);
  }

  return {
    orderId: input.orderId,
    status: "activated",
    startsAt: updated.starts_at ?? startsAt,
    endsAt: updated.ends_at ?? endsAt,
  };
}

export async function getActiveSelfServeAds(limit = 3) {
  const nowIso = new Date().toISOString();
  const { error: expireError } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .update({
      status: "expired",
      updated_at: nowIso,
    })
    .eq("status", "active")
    .lt("ends_at", nowIso);
  if (expireError) {
    throw new Error(expireError.message);
  }

  const { data, error } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .select(
      "id,business_name,contact_email,title,image_url,target_url,description,amount_cents,currency,status,plan_id,plan_label,duration_days,starts_at,ends_at,stripe_checkout_session_id,stripe_payment_intent_id,created_at,updated_at",
    )
    .eq("status", "active")
    .gte("ends_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => fromRow(row as SelfServeAdOrderRow));
}

export async function countStalePendingSelfServeAdOrders(maxAgeHours = 6) {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("self_serve_ad_orders")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "pending_payment")
    .lt("created_at", cutoff);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export function getSelfServeAdPlans() {
  return SELF_SERVE_AD_PLANS;
}

export function getSelfServeAdPlan(planId: SelfServeAdPlanId) {
  return SELF_SERVE_AD_PLANS.find((plan) => plan.id === planId) ?? null;
}
