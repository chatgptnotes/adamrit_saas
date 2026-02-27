-- Quick Fix: Create Mock Users for Login Testing
-- Run this in Supabase SQL Editor

-- Step 1: Check if User table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'User'
);

-- Step 2: Create users if they don't exist
INSERT INTO "User" (email, password, role, hospital_type, is_active)
VALUES 
  -- Admin
  ('admin@hopehospital.com', 'Admin@Hope123', 'admin', 'hope', true),
  
  -- Reception
  ('reception1@hopehospital.com', 'Reception@123', 'reception', 'hope', true),
  ('reception2@hopehospital.com', 'Reception@456', 'reception', 'hope', true),
  
  -- Lab
  ('lab@hopehospital.com', 'Lab@Hope123', 'lab', 'hope', true),
  
  -- Radiology
  ('radiology@hopehospital.com', 'Radio@Hope123', 'radiology', 'hope', true),
  
  -- Pharmacy
  ('pharmacy@hopehospital.com', 'Pharma@Hope123', 'pharmacy', 'hope', true),
  
  -- Doctors
  ('doctor1@hopehospital.com', 'Doctor@Hope123', 'doctor', 'hope', true),
  ('doctor2@hopehospital.com', 'Doctor@Hope456', 'doctor', 'hope', true),
  
  -- Nurses
  ('nurse1@hopehospital.com', 'Nurse@Hope123', 'nurse', 'hope', true),
  ('nurse2@hopehospital.com', 'Nurse@Hope456', 'nurse', 'hope', true),
  
  -- Super Admin
  ('superadmin@yourapp.com', 'SuperAdmin@123', 'super_admin', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- Step 3: Verify users created
SELECT email, role, hospital_type, is_active FROM "User" 
WHERE email LIKE '%hopehospital.com' OR email LIKE '%yourapp.com';

-- Step 4: Fix RLS policies for User table
-- Disable RLS temporarily for testing (ONLY IN DEVELOPMENT!)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- Or create proper policy:
DROP POLICY IF EXISTS "Allow login for all users" ON "User";
CREATE POLICY "Allow login for all users" ON "User"
  FOR SELECT USING (true);

-- Re-enable RLS with permissive policy
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Mock users created successfully!';
  RAISE NOTICE 'Try logging in with:';
  RAISE NOTICE '  Email: admin@hopehospital.com';
  RAISE NOTICE '  Password: Admin@Hope123';
END $$;
