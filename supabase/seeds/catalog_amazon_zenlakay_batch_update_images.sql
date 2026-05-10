-- Patch image_urls for existing rows (same amzn.to links as batch seed).
-- Run in Supabase if you already inserted catalog items with empty image_urls.

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/81LSfUZqhdL._AC_PT0_BL0_SX216_SY110_FMwebp_QL25_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4u3jdm8';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/61RPfoW28HL._AC_QL10_SX980_SY55_FMwebp_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4wkBSeJ';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/51-48al4Y6L._AC_PT0_BL0_SY110_FMwebp_QL25_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/3Pyylce';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/61NcKNERXIL._AC_QL10_SX980_SY55_FMwebp_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4d69fZW';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/6122ep9XBSL.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/42KlEhL';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/71f7bN68jvL._AC_QL10_SX980_SY55_FMwebp_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4dgFSUS';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/51jxm3pQYRL.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/48QwCpe';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/91h4WTAycXL._AC_PT0_BL0_SX216_SY110_FMwebp_QL25_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/42XFy8L';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/71OIhEpBJcL._AC_PT0_BL0_SX216_SY110_FMwebp_QL25_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/3RbUoWD';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/51F8j5gqoAL._AC_QL10_SX980_SY55_FMwebp_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4dAIApy';
