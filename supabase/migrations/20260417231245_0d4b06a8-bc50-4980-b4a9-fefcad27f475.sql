-- Tabela de disponibilidade de itens (categorias, produtos do catálogo, sabores)
CREATE TABLE public.item_availability (
  item_key TEXT NOT NULL PRIMARY KEY,
  item_type TEXT NOT NULL,
  label TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.item_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
ON public.item_availability FOR SELECT USING (true);

CREATE POLICY "Anyone can insert availability"
ON public.item_availability FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update availability"
ON public.item_availability FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete availability"
ON public.item_availability FOR DELETE USING (true);

CREATE TRIGGER update_item_availability_updated_at
BEFORE UPDATE ON public.item_availability
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.item_availability;