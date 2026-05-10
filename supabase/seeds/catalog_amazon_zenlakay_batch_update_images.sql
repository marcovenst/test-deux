/*
  Patch image_urls for existing rows (same amzn.to links as batch seed).
  Run in Supabase if you already inserted catalog items with empty image_urls.
*/

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/81MveRX6xRL._SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4u3jdm8';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/61XgBmBmp3L._SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4wkBSeJ';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/51ukuzBQ2dL._SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/3Pyylce';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/51KE2qGMkyL._SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4d69fZW';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/71HxIHQWL1L._AC_SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/42KlEhL';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/41C2K+YmZ6L._AC_SL1000_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4dgFSUS';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/413OvvO48DL._AC_SL1000_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/48QwCpe';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/71xA+fr8pBL._AC_SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/42XFy8L';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/61N9HsCVfCL._AC_SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/3RbUoWD';

update public.marketplace_catalog_items
set image_urls = array['https://m.media-amazon.com/images/I/71J7B7RZ9QL._AC_SL1500_.jpg']::text[], updated_at = now()
where external_url = 'https://amzn.to/4dAIApy';
