-- ============================================================
-- HealMyCity — Storage Scheme for Issue Images
-- Run this in the Supabase SQL Editor AFTER the main schema
-- ============================================================

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('issues-images', 'issues-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to view images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'issues-images' );

-- 3. Allow authenticated users to upload their own images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'issues-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow users to update their own images
CREATE POLICY "Allow authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'issues-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Allow users to delete their own images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'issues-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
);
