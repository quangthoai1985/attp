-- Create site_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.site_config (
    id TEXT PRIMARY KEY DEFAULT 'main', -- Single row for global config, or use UUID
    logo_url TEXT,
    logo_height INTEGER DEFAULT 40,
    login_background_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- Policies for site_config
-- Everyone can read (public) - essential for login page background
CREATE POLICY "Public can view site config" ON public.site_config
    FOR SELECT USING (true);

-- Only authenticated users (or admins) can update
CREATE POLICY "Staff/Admin can update site config" ON public.site_config
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow insert (for initial setup)
CREATE POLICY "Staff/Admin can insert site config" ON public.site_config
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
