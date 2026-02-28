-- Fix Supabase Storage RLS Policy Errors
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete radiology files" ON storage.objects;

-- 2. Create simpler, more permissive policies for radiology-files bucket

-- Allow anyone to upload (you can restrict this later)
CREATE POLICY "Public upload to radiology-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'radiology-files');

-- Allow anyone to read
CREATE POLICY "Public read from radiology-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'radiology-files');

-- Allow anyone to update
CREATE POLICY "Public update in radiology-files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'radiology-files');

-- Allow anyone to delete
CREATE POLICY "Public delete from radiology-files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'radiology-files');

-- 3. Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'radiology-files';

-- 4. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%radiology%';
