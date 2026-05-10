import { supabaseAdmin } from "@/lib/db/client";
import type { CommunityEventRow } from "@/lib/db/types";

export type PublicCommunityEvent = {
  id: string;
  title: string;
  description: string;
  locationLabel: string | null;
  startsAt: string;
  endsAt: string | null;
  externalUrl: string;
  source: CommunityEventRow["source"];
  imageUrl: string | null;
};

export function sourceDisplayLabel(source: CommunityEventRow["source"]): string {
  switch (source) {
    case "eventbrite":
      return "Eventbrite";
    case "ticketmaster":
      return "Ticketmaster";
    case "konpa_events":
      return "Konpa Events";
    case "randevou_a":
      return "Randevou-a";
    default:
      return "Lòt";
  }
}

export function formatCommunityEventStartsAt(iso: string): string {
  return new Intl.DateTimeFormat("fr-HT", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function fromRow(row: CommunityEventRow): PublicCommunityEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    locationLabel: row.location_label,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    externalUrl: row.external_url,
    source: row.source,
    imageUrl: row.image_url,
  };
}

function listErrorMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "PGRST205" || message.toLowerCase().includes("community_events")) {
    return "Tab evenman kominotè a (0011_community_events) pa aplike sou baz la.";
  }
  return null;
}

/**
 * Upcoming and very recent events (rolling window), soonest first.
 */
export async function listUpcomingCommunityEvents(limit = 12): Promise<{
  events: PublicCommunityEvent[];
  error: string | null;
}> {
  try {
    const horizonStart = new Date();
    horizonStart.setDate(horizonStart.getDate() - 1);

    const horizonEnd = new Date();
    horizonEnd.setDate(horizonEnd.getDate() + 90);

    const { data, error } = await supabaseAdmin
      .from("community_events")
      .select("*")
      .eq("active", true)
      .gte("starts_at", horizonStart.toISOString())
      .lte("starts_at", horizonEnd.toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return { events: (data ?? []).map((r) => fromRow(r as CommunityEventRow)), error: null };
  } catch (e) {
    console.error("listUpcomingCommunityEvents", e);
    return {
      events: [],
      error: listErrorMessage(e) ?? "Pa ka chaje kalandriye evenman yo.",
    };
  }
}
