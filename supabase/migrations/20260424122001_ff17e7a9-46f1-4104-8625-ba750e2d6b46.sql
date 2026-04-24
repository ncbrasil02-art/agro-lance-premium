-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    cpf TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_approved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ANIMALS TABLE
CREATE TABLE public.animals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    internal_code TEXT,
    registration_number TEXT,
    species TEXT,
    breed TEXT,
    sex TEXT CHECK (sex IN ('M', 'F')),
    birth_date DATE,
    color TEXT,
    weight NUMERIC,
    height NUMERIC,
    location TEXT,
    photos TEXT[] DEFAULT '{}',
    videos TEXT[] DEFAULT '{}',
    genealogy JSONB DEFAULT '{}',
    health_info JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EVENTS TABLE
CREATE TABLE public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    banner_url TEXT,
    video_url TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    auctioneer_name TEXT,
    promoter_company TEXT,
    transmission_link TEXT,
    event_type TEXT CHECK (event_type IN ('presencial', 'online', 'híbrido')),
    commission_rate NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
    mode TEXT DEFAULT 'individual' CHECK (mode IN ('individual', 'sequential')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. LOTS TABLE
CREATE TABLE public.lots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES public.animals(id) ON DELETE SET NULL,
    lot_number INTEGER NOT NULL,
    starting_price NUMERIC NOT NULL,
    reserve_price NUMERIC,
    bid_increment NUMERIC NOT NULL DEFAULT 50,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'sold', 'passed')),
    current_price NUMERIC,
    bids_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BIDS TABLE
CREATE TABLE public.bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lot_id UUID REFERENCES public.lots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    amount NUMERIC NOT NULL,
    is_manual BOOLEAN DEFAULT false,
    bid_type TEXT DEFAULT 'online' CHECK (bid_type IN ('online', 'phone', 'in_person')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Animals
CREATE POLICY "Animals are viewable by everyone." ON public.animals
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify animals." ON public.animals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Events
CREATE POLICY "Events are viewable by everyone." ON public.events
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify events." ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Lots
CREATE POLICY "Lots are viewable by everyone." ON public.lots
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify lots." ON public.lots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Bids
CREATE POLICY "Bids are viewable by everyone." ON public.bids
    FOR SELECT USING (true);

CREATE POLICY "Approved users can place bids." ON public.bids
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_approved = true
        )
    );

-- FUNCTION TO HANDLE NEW USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FOR NEW USER SIGNUP
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS FOR UPDATED_AT
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_animals_updated_at BEFORE UPDATE ON public.animals FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_lots_updated_at BEFORE UPDATE ON public.lots FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
