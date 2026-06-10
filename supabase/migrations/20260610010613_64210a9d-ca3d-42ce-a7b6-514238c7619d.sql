
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.orders SET status = 'aguardando_pagamento' WHERE status = 'recebido';
UPDATE public.orders SET paid_at = created_at WHERE status = 'pago' AND paid_at IS NULL;

ALTER TABLE public.orders ALTER COLUMN status SET DEFAULT 'aguardando_pagamento';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS image text;

CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_paid_at_idx ON public.orders(paid_at);
