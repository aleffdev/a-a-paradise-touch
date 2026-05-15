ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT 'Cliente',
ADD COLUMN IF NOT EXISTS payment_method text;

CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON public.orders (lower(customer_name));
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);