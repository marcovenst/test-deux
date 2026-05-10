-- One Amazon Associates pick for Achte (external_affiliate).
-- Run in Supabase SQL Editor after migration 0010_marketplace_catalog.sql is applied.
-- Verify price on Amazon before running — prices change.

insert into public.marketplace_catalog_items (
  title,
  description,
  price_cents,
  shipping_cents,
  currency,
  image_urls,
  purchase_mode,
  external_url,
  affiliate_note,
  active,
  sort_order
) values (
  'Human Braiding Hair — Boho braids 110g 20" (3 bundles, natural)',
  'Cheve natirèl pou tress / boho braid: 110g, 20 pous, vag pwofon 12A, 3 pake, koulè natirèl. Lyen Amazon — verifye pri ak disponiblite sou sit la.',
  3999,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/51eFZLnz-PL.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4ucEZ79',
  'Lyen partenè Amazon. Zenlakay ka twen yon ti komisyon sou acha ki kalifye, san frè adisyonèl pou w.',
  true,
  100
);
