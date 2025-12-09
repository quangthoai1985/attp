-- Drop existing policies to ensure clean slate
DROP POLICY IF EXISTS "Public can view site config" ON public.site_config;
DROP POLICY IF EXISTS "Staff/Admin can update site config" ON public.site_config;
DROP POLICY IF EXISTS "Staff/Admin can insert site config" ON public.site_config;

-- Re-enable RLS (just in case)
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 1. Allow EVERYONE to read (anon + authenticated)
CREATE POLICY "Public can view site config" 
ON public.site_config 
FOR SELECT 
USING (true);

-- 2. Allow ALL Authenticated users to INSERT
CREATE POLICY "Authenticated can insert site config" 
ON public.site_config 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Allow ALL Authenticated users to UPDATE
CREATE POLICY "Authenticated can update site config" 
ON public.site_config 
FOR UPDATE 
TO authenticated 
USING (true);

-- 4. Allow ALL Authenticated users to DELETE (just in case needed later)
CREATE POLICY "Authenticated can delete site config" 
ON public.site_config 
FOR DELETE 
TO authenticated 
USING (true);
