-- Adicionar campos de venda direta na tabela animals
ALTER TABLE public.animals 
ADD COLUMN is_direct_sale BOOLEAN DEFAULT false,
ADD COLUMN sale_price NUMERIC,
ADD COLUMN sale_status TEXT DEFAULT 'available' CHECK (sale_status IN ('available', 'reserved', 'sold'));

-- Criar tabela de vendas diretas
CREATE TABLE public.direct_sales (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    animal_id UUID NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES public.profiles(id),
    buyer_name TEXT,
    buyer_email TEXT,
    buyer_phone TEXT,
    total_price NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
    shipping_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela direct_sales
ALTER TABLE public.direct_sales ENABLE ROW LEVEL SECURITY;

-- Políticas para direct_sales
CREATE POLICY "Admins can manage all direct sales" 
ON public.direct_sales FOR ALL 
TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own direct sales" 
ON public.direct_sales FOR SELECT 
TO authenticated 
USING (buyer_id = auth.uid());

CREATE POLICY "Anyone can create a direct sale" 
ON public.direct_sales FOR INSERT 
TO public 
WITH CHECK (true);

-- Função para atualizar status do animal e lotes relacionados quando uma venda é confirmada
CREATE OR REPLACE FUNCTION public.handle_confirmed_direct_sale()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        -- Atualizar status do animal
        UPDATE public.animals 
        SET sale_status = 'sold' 
        WHERE id = NEW.animal_id;
        
        -- Atualizar status de qualquer lote ativo que contenha este animal
        UPDATE public.lots 
        SET status = 'closed' 
        WHERE animal_id = NEW.animal_id AND status != 'closed';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para chamar a função ao atualizar o status da venda
CREATE TRIGGER on_direct_sale_confirmed
AFTER UPDATE ON public.direct_sales
FOR EACH ROW
EXECUTE FUNCTION public.handle_confirmed_direct_sale();

-- Trigger para atualizar timestamps
CREATE TRIGGER update_direct_sales_updated_at
BEFORE UPDATE ON public.direct_sales
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
