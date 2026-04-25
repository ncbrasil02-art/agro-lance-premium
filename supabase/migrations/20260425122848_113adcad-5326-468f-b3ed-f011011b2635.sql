-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies for categories
CREATE POLICY "Categories are viewable by everyone" 
ON public.categories FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Add category_id to animals
ALTER TABLE public.animals ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);

-- Insert initial categories
INSERT INTO public.categories (name) VALUES 
('Manga-larga'),
('Nacional'),
('Coberturas'),
('Garanhão (reprodutores)'),
('Potros'),
('Éguas'),
('Potras'),
('Cavalos de Sela'),
('Cavalos de Competição'),
('Jumentos(as) Pega'),
('Muares'),
('Bovinos'),
('Bubalinos'),
('Ovinos'),
('Caprinos')
ON CONFLICT (name) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
