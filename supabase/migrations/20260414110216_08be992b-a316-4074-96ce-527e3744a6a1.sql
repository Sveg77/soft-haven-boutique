ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_date date,
ADD COLUMN IF NOT EXISTS delivery_time time;

ALTER TABLE public.order_items
ADD COLUMN IF NOT EXISTS product_name text,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS line_total numeric NOT NULL DEFAULT 0;