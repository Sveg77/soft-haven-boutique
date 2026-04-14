
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert categories" ON public.categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" ON public.categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories" ON public.categories
  FOR DELETE TO authenticated USING (true);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  characteristics JSONB DEFAULT '{}',
  in_stock BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products" ON public.products
  FOR DELETE TO authenticated USING (true);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  delivery_method TEXT NOT NULL DEFAULT 'pickup',
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view order items" ON public.order_items
  FOR SELECT TO authenticated USING (true);
