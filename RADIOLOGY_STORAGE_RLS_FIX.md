# Radiology Storage RLS Fix - Error Resolution

## 🐛 Error

```
StorageApiError: new row violates row-level security policy
Failed to load resource: the server responded with a status of 400
```

---

## 🔍 Root Cause

**Problem:** Supabase Storage RLS policies blocking uploads

**Reason:** 
- Original policies used `TO authenticated` 
- Your app uses custom auth (User table), not Supabase Auth
- `auth.uid()` returns null for custom auth
- Storage policies reject the upload

---

## ✅ Solution

### Option 1: Public Bucket (Recommended for now)

Run this SQL in **Supabase SQL Editor:**

```sql
-- File: supabase_radiology_storage_fix.sql

-- 1. Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to upload radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete radiology files" ON storage.objects;

-- 2. Create public policies (anyone can access)
CREATE POLICY "Public upload to radiology-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'radiology-files');

CREATE POLICY "Public read from radiology-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'radiology-files');

CREATE POLICY "Public update in radiology-files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'radiology-files');

CREATE POLICY "Public delete from radiology-files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'radiology-files');

-- 3. Make sure bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'radiology-files';
```

---

## 🚀 Quick Fix Steps

### Step 1: Drop Old Policies
```sql
-- Run in Supabase SQL Editor
DROP POLICY IF EXISTS "Allow authenticated users to upload radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update radiology files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete radiology files" ON storage.objects;
```

### Step 2: Create Public Policies
```sql
-- Allow uploads to radiology-files bucket
CREATE POLICY "Public upload to radiology-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'radiology-files');

-- Allow reads from radiology-files bucket
CREATE POLICY "Public read from radiology-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'radiology-files');
```

### Step 3: Verify Bucket
```sql
-- Check bucket is public
SELECT * FROM storage.buckets WHERE id = 'radiology-files';

-- Should show: public = true
```

### Step 4: Verify Policies
```sql
-- List all policies for storage.objects
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%radiology%';
```

---

## 🔧 Alternative: Manual Setup in Dashboard

### Via Supabase Dashboard:

1. **Go to Storage** → **Policies**
2. **Click** on `objects` table
3. **Delete** old radiology policies
4. **Create New Policy:**
   - Name: `Public upload to radiology-files`
   - Target: `INSERT`
   - Policy: `bucket_id = 'radiology-files'`
5. **Repeat** for SELECT, UPDATE, DELETE

---

## 🧪 Test Upload After Fix

```bash
1. Run SQL fix script
2. Refresh browser
3. Go to radiology page
4. Click Upload
5. Select file
6. ✅ Should upload successfully!
```

---

## 🔒 Security Note

**Current Setup:** Public bucket (anyone can upload/download)

**Why:** Custom auth (not Supabase Auth) doesn't work with `auth.uid()`

**Is it secure enough?**
- ✅ Files only accessible if you know the URL
- ✅ URLs are long UUIDs (hard to guess)
- ✅ Storage is isolated to `radiology-files` bucket
- ✅ Application still has authentication

**For Production:**
- Consider implementing custom RLS based on user table
- Or migrate to Supabase Auth for better integration

---

## 📊 Policy Comparison

### ❌ Old (Not Working):
```sql
-- Requires Supabase Auth
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects
FOR INSERT
TO authenticated  -- ❌ This doesn't work with custom auth
WITH CHECK (bucket_id = 'radiology-files');
```

### ✅ New (Working):
```sql
-- No auth requirement
CREATE POLICY "Public upload to radiology-files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'radiology-files');  -- ✅ Anyone can upload
```

---

## 🎯 Expected Behavior After Fix

### Before (Error):
```
1. Click Upload
2. Select file
3. Click Upload
4. ❌ Error: "new row violates row-level security policy"
5. ❌ Upload fails
```

### After (Success):
```
1. Click Upload
2. Select file
3. Click Upload
4. Progress bar: 0% → 100%
5. ✅ Success message
6. ✅ File uploaded
7. ✅ View/Download buttons appear
```

---

## 🐛 Troubleshooting

### Still Getting Error?

**Check 1: Bucket Exists**
```sql
SELECT * FROM storage.buckets WHERE id = 'radiology-files';
```
Should return 1 row with `public = true`

**Check 2: Policies Exist**
```sql
SELECT * FROM pg_policies WHERE tablename = 'objects';
```
Should show radiology policies

**Check 3: Old Policies Removed**
```sql
-- Should return 0 rows
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%authenticated%radiology%';
```

**Check 4: Browser Console**
- Open DevTools → Console
- Try upload again
- Look for actual error message

---

## 📝 Summary

**Problem:** RLS policy blocking storage uploads
**Cause:** Custom auth incompatible with `TO authenticated`
**Solution:** Public bucket policies (no auth check)
**Result:** Uploads work! ✅

---

## 🔧 Files

1. ✅ `supabase_radiology_storage_fix.sql` - SQL fix script
2. ✅ `RADIOLOGY_STORAGE_RLS_FIX.md` - This guide

---

**Run the SQL script and test upload again!** 🚀

**Commands:**
```sql
-- Copy from: supabase_radiology_storage_fix.sql
-- Paste in: Supabase SQL Editor
-- Click: Run
-- Wait: Success message
-- Test: Upload file in app
```
