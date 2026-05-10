-- Curated affiliate picks (7 amzn.to links). Run once in Supabase after 0010.
-- Do not re-run without removing duplicate external_url rows first.

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
  'KUNMI — jeans colombian fanm, segondè wès, stretch',
  'Jeans skinny ki mete fòm, colombian style. Lyen Amazon — verifye gwosè ak longè.',
  3799,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/61Mi1cMTPBL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/48NqAWy',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1030
),
(
  'Roswear — pantalon capri jeans fanm (ripped)',
  'Pantalon capri, mi segondè, jeans dechire, stretch. Lyen Amazon.',
  3059,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/81wm9RBKxVL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4d1RSLl',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1029
),
(
  'Roswear — shorts bermuda jeans fanm (jis nan jenou)',
  'Shorts jean, segondè wès, longè jenou. Lyen Amazon — verifye koulè.',
  2249,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/819s-ZeEJXL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4tvaNmL',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1028
),
(
  'YRLTYO — souliye tenis / kourse / mache (gason)',
  'Sneakers atletik, lejè, pou tenis, gym, mache. Lyen Amazon — verifye nimewo sapat.',
  1979,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/71mCKt3iSuL._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4toZjRo',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1027
),
(
  'Bruno Marc KnitFlex — sneakers mesh gason, lejè',
  'Souliye Oxford ak kòd, mesh, pou travay oswa maten. Lyen Amazon.',
  3999,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/711lA5rk08L._AC_SL1500_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/42pYsoO',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1026
),
(
  'Idole — krem vizaj 50 g',
  'Krem Idole 50 g, kategori tratman vizaj. Lyen Amazon — li etikèt ak avi doktè si nesesè.',
  1317,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/51EEcfwgc9L._SL1000_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4uz0EWP',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1025
),
(
  'Versace Eros — parfim gason, 3.4 oz parfum spray',
  'Parfim Versace Eros pou gason. Lyen Amazon — verifye otantisite vannè.',
  7999,
  0,
  'usd',
  array['https://m.media-amazon.com/images/I/71mtEpz9s-L._SL1467_.jpg']::text[],
  'external_affiliate',
  'https://amzn.to/4uzbnRa',
  'Lyen partenè Amazon. Zenlakay ka twen yon komisyon sou acha ki kalifye.',
  true,
  1024
);
