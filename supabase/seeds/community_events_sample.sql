-- Sample rows for public.community_events (Pwogram semèn nan).
-- Run in Supabase after supabase/migrations/0011_community_events.sql.
-- Verify dates and tickets on the organizer site before promoting.

insert into public.community_events (
  title,
  description,
  location_label,
  starts_at,
  ends_at,
  external_url,
  source,
  sort_order
) values
(
  'Haitian Heritage Month Kickoff — Art Show (Unity Fest 2026)',
  'Atizay, pèfòmans, istwa. Verifye lè sou sit Greater Miami CVB.',
  'Chef Creole Seasoned Restaurant, North Miami, FL',
  timestamptz '2026-05-15T18:00:00-04:00',
  null,
  'https://www.miamiandbeaches.com/event/haitian-heritage-month-kickoff-art-show/39954',
  'other',
  28
),
(
  'Haitian Flag Day — Bedjine, K-Dilak, Tony Mix, Rara Lakay…',
  'Gwo seremoni muzik ak kilti. Verifye lè egzak sou Eventbrite.',
  'Little Haiti Cultural Complex, Miami, FL',
  timestamptz '2026-05-18T16:00:00-04:00',
  timestamptz '2026-05-18T23:00:00-04:00',
  'https://www.eventbrite.com/e/haitian-flag-day-bedjine-k-dilak-tony-mix-rara-lakay-kidnely-tickets-1474910700609',
  'eventbrite',
  20
),
(
  'Haitian Heritage Celebration — Miami Marlins',
  'Match / aktivite fanmi. Verifye dat e tikè sou Eventbrite.',
  'loanDepot park, Miami, FL',
  timestamptz '2026-06-15T19:00:00-04:00',
  null,
  'https://www.eventbrite.com/e/haitian-heritage-celebration-with-miami-marlins-tickets-1348865636429',
  'eventbrite',
  10
);
