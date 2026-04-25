-- Create sellers table
CREATE TABLE public.sellers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('pessoa', 'fazenda')),
    email TEXT,
    phone TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add seller_id to animals
ALTER TABLE public.animals ADD COLUMN seller_id UUID REFERENCES public.sellers(id);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Policies for sellers
CREATE POLICY "Sellers are viewable by everyone" 
ON public.sellers FOR SELECT USING (true);

CREATE POLICY "Admins can manage sellers" 
ON public.sellers FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

-- Trigger for updated_at
CREATE TRIGGER update_sellers_updated_at
BEFORE UPDATE ON public.sellers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();