-- Create event_requests table
CREATE TABLE public.event_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    category TEXT,
    location TEXT,
    additional_info TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can create event requests" 
ON public.event_requests FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view and manage event requests" 
ON public.event_requests 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Trigger for updated_at
CREATE TRIGGER update_event_requests_updated_at
BEFORE UPDATE ON public.event_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
