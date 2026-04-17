-- Products table (managed by admin)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  flavors TEXT[] NOT NULL DEFAULT '{}',
  emoji TEXT NOT NULL DEFAULT '🍦',
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert products"
  ON public.products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON public.products FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete products"
  ON public.products FOR DELETE
  USING (true);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('local', 'viagem')),
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'recebido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON public.orders FOR UPDATE
  USING (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_products_category ON public.products(category);