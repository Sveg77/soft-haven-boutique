UPDATE public.products
SET images = ARRAY[
  'https://nbutrmnqkmgmrxjtqdil.supabase.co/storage/v1/object/public/product-images/alpine-plaid.jpg',
  'https://nbutrmnqkmgmrxjtqdil.supabase.co/storage/v1/object/public/product-images/alpine-olive.jpg',
  'https://nbutrmnqkmgmrxjtqdil.supabase.co/storage/v1/object/public/product-images/alpine-beige.jpg'
]
WHERE id = '49b7b39d-0f6c-410d-9951-50aefd1f55e6';