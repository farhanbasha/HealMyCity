-- Fix RLS policies for HealMyCity
-- Run this in Supabase SQL Editor if you've already run migrations 001 and 002

-- Add missing INSERT policy for users table (needed for signup trigger)
CREATE POLICY IF NOT EXISTS "Users can be created via trigger"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Replace issues INSERT policy to use uid check instead of role check
DROP POLICY IF EXISTS "Authenticated users can create issues" ON public.issues;

CREATE POLICY "Users can create their own issues"
    ON public.issues FOR INSERT
    WITH CHECK (auth.uid() = user_id);
