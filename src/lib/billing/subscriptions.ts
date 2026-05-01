import type Stripe from "stripe";

import { supabaseAdmin } from "@/lib/db/client";
import type {
  BillingSubscriptionRow,
  BillingSubscriptionStatus,
} from "@/lib/db/types";

const ACTIVE_STATUSES: BillingSubscriptionStatus[] = ["active", "trialing"];

type BillingSubscription = {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: BillingSubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
  stripeLatestEventId: string | null;
  stripeLatestEventCreated: string | null;
  createdAt: string;
  updatedAt: string;
};

type UpsertSubscriptionInput = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: BillingSubscriptionStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripePriceId: string | null;
  stripeEventId?: string;
  stripeEventCreated?: number;
};

function fromRow(row: BillingSubscriptionRow): BillingSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    stripePriceId: row.stripe_price_id,
    stripeLatestEventId: row.stripe_latest_event_id,
    stripeLatestEventCreated: row.stripe_latest_event_created,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function asIsoFromUnix(unixSeconds?: number | null) {
  if (!unixSeconds) {
    return null;
  }
  return new Date(unixSeconds * 1000).toISOString();
}

function stripeStatusToBillingStatus(status: Stripe.Subscription.Status): BillingSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return status;
    default:
      return "incomplete";
  }
}

export function subscriptionHasEntitlement(status: BillingSubscriptionStatus) {
  return ACTIVE_STATUSES.includes(status);
}

export async function getBillingSubscriptionByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select(
      "id,user_id,stripe_customer_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end,stripe_price_id,stripe_latest_event_id,stripe_latest_event_created,created_at,updated_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data as BillingSubscriptionRow) : null;
}

async function getBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId: string) {
  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .select(
      "id,user_id,stripe_customer_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end,stripe_price_id,stripe_latest_event_id,stripe_latest_event_created,created_at,updated_at",
    )
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? fromRow(data as BillingSubscriptionRow) : null;
}

export async function upsertBillingSubscription(input: UpsertSubscriptionInput) {
  const now = new Date().toISOString();
  const eventCreatedIso = input.stripeEventCreated
    ? new Date(input.stripeEventCreated * 1000).toISOString()
    : null;

  const { data, error } = await supabaseAdmin
    .from("billing_subscriptions")
    .upsert(
      {
        user_id: input.userId,
        stripe_customer_id: input.stripeCustomerId,
        stripe_subscription_id: input.stripeSubscriptionId,
        status: input.status,
        current_period_end: input.currentPeriodEnd,
        cancel_at_period_end: input.cancelAtPeriodEnd,
        stripe_price_id: input.stripePriceId,
        stripe_latest_event_id: input.stripeEventId ?? null,
        stripe_latest_event_created: eventCreatedIso,
        updated_at: now,
      },
      {
        onConflict: "stripe_subscription_id",
      },
    )
    .select(
      "id,user_id,stripe_customer_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end,stripe_price_id,stripe_latest_event_id,stripe_latest_event_created,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to persist billing subscription");
  }

  return fromRow(data as BillingSubscriptionRow);
}

export async function syncBillingFromCheckoutSession(input: {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeEventId?: string;
  stripeEventCreated?: number;
}) {
  return upsertBillingSubscription({
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: "incomplete",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    stripePriceId: null,
    stripeEventId: input.stripeEventId,
    stripeEventCreated: input.stripeEventCreated,
  });
}

export async function syncBillingFromSubscriptionObject(input: {
  subscription: Stripe.Subscription;
  userIdHint?: string;
  stripeEventId?: string;
  stripeEventCreated?: number;
}) {
  const stripeSubscriptionId = input.subscription.id;
  const stripeCustomerId =
    typeof input.subscription.customer === "string"
      ? input.subscription.customer
      : input.subscription.customer.id;

  const known = await getBillingSubscriptionByStripeSubscriptionId(stripeSubscriptionId);
  const userId = input.userIdHint ?? known?.userId;

  if (!userId) {
    throw new Error(`Cannot map subscription ${stripeSubscriptionId} to a user`);
  }

  const stripePriceId = input.subscription.items.data[0]?.price?.id ?? null;

  return upsertBillingSubscription({
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    status: stripeStatusToBillingStatus(input.subscription.status),
    currentPeriodEnd: asIsoFromUnix(input.subscription.current_period_end),
    cancelAtPeriodEnd: Boolean(input.subscription.cancel_at_period_end),
    stripePriceId,
    stripeEventId: input.stripeEventId,
    stripeEventCreated: input.stripeEventCreated,
  });
}

export async function markBillingPaymentFailed(input: {
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripeEventId?: string;
  stripeEventCreated?: number;
}) {
  let existing = input.stripeSubscriptionId
    ? await getBillingSubscriptionByStripeSubscriptionId(input.stripeSubscriptionId)
    : null;

  if (!existing) {
    const { data, error } = await supabaseAdmin
      .from("billing_subscriptions")
      .select(
        "id,user_id,stripe_customer_id,stripe_subscription_id,status,current_period_end,cancel_at_period_end,stripe_price_id,stripe_latest_event_id,stripe_latest_event_created,created_at,updated_at",
      )
      .eq("stripe_customer_id", input.stripeCustomerId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    existing = data ? fromRow(data as BillingSubscriptionRow) : null;
  }

  if (!existing) {
    throw new Error("No billing subscription found for payment failure event");
  }

  return upsertBillingSubscription({
    userId: existing.userId,
    stripeCustomerId: existing.stripeCustomerId,
    stripeSubscriptionId: existing.stripeSubscriptionId,
    status: "past_due",
    currentPeriodEnd: existing.currentPeriodEnd,
    cancelAtPeriodEnd: existing.cancelAtPeriodEnd,
    stripePriceId: existing.stripePriceId,
    stripeEventId: input.stripeEventId,
    stripeEventCreated: input.stripeEventCreated,
  });
}

export async function getBillingStatus(userId: string) {
  const subscription = await getBillingSubscriptionByUserId(userId);
  if (!subscription) {
    return {
      userId,
      hasActiveSubscription: false,
      status: "none" as const,
      currentPeriodEnd: null as string | null,
      cancelAtPeriodEnd: false,
    };
  }

  return {
    userId,
    hasActiveSubscription: subscriptionHasEntitlement(subscription.status),
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}

export async function ensureActiveSubscription(userId: string) {
  const status = await getBillingStatus(userId);
  return status.hasActiveSubscription;
}
