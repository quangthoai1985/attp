-- Fix RLS policies for facilities table
-- The issue is that the admin policy uses FOR ALL USING but lacks WITH CHECK for INSERT operations

-- First, drop the existing admin policy
DROP POLICY IF EXISTS "Admin full access facilities" ON public.facilities;

-- Recreate the admin policy with proper WITH CHECK clause
-- Using USING for SELECT/UPDATE/DELETE and WITH CHECK for INSERT
CREATE POLICY "Admin full access facilities" ON public.facilities
    FOR ALL 
    USING (get_current_user_role() = 'admin')
    WITH CHECK (get_current_user_role() = 'admin');

-- Alternative: Create a simpler policy that allows authenticated users with admin role
-- If the above doesn't work, uncomment these and comment out the above:

-- DROP POLICY IF EXISTS "Admin full access facilities" ON public.facilities;
-- 
-- CREATE POLICY "Admin can select facilities" ON public.facilities
--     FOR SELECT 
--     TO authenticated
--     USING (get_current_user_role() = 'admin');
-- 
-- CREATE POLICY "Admin can insert facilities" ON public.facilities
--     FOR INSERT 
--     TO authenticated
--     WITH CHECK (get_current_user_role() = 'admin');
-- 
-- CREATE POLICY "Admin can update facilities" ON public.facilities
--     FOR UPDATE 
--     TO authenticated
--     USING (get_current_user_role() = 'admin');
-- 
-- CREATE POLICY "Admin can delete facilities" ON public.facilities
--     FOR DELETE 
--     TO authenticated
--     USING (get_current_user_role() = 'admin');

-- Also ensure the profiles table has the admin user with correct role
-- You may need to run this manually with the actual UUID:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<your-user-uuid>';
