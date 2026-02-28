-- Supabase Storage Bucket Setup for Radiology Files
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket for radiology files
INSERT INTO storage.buckets (id, name, public)
VALUES ('radiology-files', 'radiology-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up storage policies for radiology-files bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload radiology files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'radiology-files');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read radiology files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'radiology-files');

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Allow authenticated users to update radiology files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'radiology-files');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete radiology files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'radiology-files');

-- 3. Add file_url column to visit_radiology table (if not exists)
ALTER TABLE visit_radiology 
ADD COLUMN IF NOT EXISTS file_url TEXT;

-- 4. Add file_name column to visit_radiology table (if not exists)
ALTER TABLE visit_radiology 
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 5. Add uploaded_at column to visit_radiology table (if not exists)
ALTER TABLE visit_radiology 
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- 6. Add uploaded_by column to visit_radiology table (if not exists)
ALTER TABLE visit_radiology 
ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- Note: Run these commands in Supabase SQL Editor
-- Then verify in Storage > Buckets that 'radiology-files' bucket exists
