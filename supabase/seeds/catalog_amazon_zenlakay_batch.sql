-- Amazon Associates picks for Achte (external_affiliate).
-- Run in Supabase SQL Editor after 0010_marketplace_catalog.sql.
-- image_urls: primary hi-res PDP images (better match + sharpness than og:social thumbnails).
-- Re-check prices on Amazon before running; update price_cents if needed.

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
) values
(
  'Cheve tres boho — karamel blonde 110g 20", 3 pake',
  'Cheve limen pou boho braids / knotless, vag pwofon 12A, 3 bann, koulè karamel honey blonde. Lyen Amazon.',
  4199,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/81MveRX6xRL._SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4u3jdm8',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1000
),
(
  'Bellavita Luxury Honey Oud — EDP 100 ml',
  'Parfim pou fanm ak gason: myel, bergamot, oud, ambr. Lyen Amazon.',
  1799,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/61XgBmBmp3L._SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4wkBSeJ',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  990
),
(
  'Bellavita Luxury Narco — EDP 100 ml',
  'Parfim unisex: flè, bergamot, jasmine, white musk, dire lontan. Lyen Amazon.',
  1799,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/51ukuzBQ2dL._SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/3Pyylce',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  980
),
(
  'Bellavita Luxury CEO MAN — EDP 100 ml',
  'Parfim gason: mandarin, sitwon, lavender, vetiver, dire lontan. Lyen Amazon.',
  1799,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/51KE2qGMkyL._SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4d69fZW',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  970
),
(
  'YYTBOD — echarpe gradwasyon drapo Ayiti (Class of 2026, 72")',
  'Satin 72 pous, tòs dò, pou etidyan entènasyonal. Lyen Amazon — verifye stil koulè sou paj la.',
  1699,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/71HxIHQWL1L._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/42KlEhL',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  960
),
(
  'Kolye 14K gold — kè ak kat Ayiti (Ayiti charm)',
  'Kolye map Ayiti 14K gold pou fanm. Lyen Amazon — verifye pri ak delivri.',
  2999,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/41C2K+YmZ6L._AC_SL1000_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4dgFSUS',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  950
),
(
  'Kolye "I Love Haiti" — 925 silver map Ayiti',
  'Charm kat Ayiti ak chèn. Lyen Amazon.',
  2999,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/413OvvO48DL._AC_SL1000_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/48QwCpe',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  940
),
(
  'SMBOE — short sport Happy Haitian Flag Day 1804',
  'Short yoga / kourse, segondè wès, biker style. Lyen Amazon — verifye gwosè ak stil.',
  1198,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/71xA+fr8pBL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/42XFy8L',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  930
),
(
  'Queenie Ke BareLuxe — leggings 27", ultra high waist (Black, S)',
  'Leggings yoga / gym, kontwòl vant. Lyen Amazon — verifye koulè ak gwosè.',
  2157,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/61N9HsCVfCL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/3RbUoWD',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  920
),
(
  'Blisset — 3 pye leggings segondè wès ak poch',
  '3 pake leggings mol, yoga, kourse. Lyen Amazon.',
  2499,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/71J7B7RZ9QL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4dAIApy',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  910
);
