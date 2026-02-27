-- Seed Mock Data for Testing
-- WARNING: This is for DEVELOPMENT/TESTING only!

-- ============================================
-- 1. CLEAN UP (Optional - uncomment to reset)
-- ============================================
-- DELETE FROM user_activity_log;
-- DELETE FROM "User" WHERE email LIKE '%example.com' OR email LIKE '%yourapp.com' OR email LIKE '%hopehospital.com' OR email LIKE '%xyzclinic.com' OR email LIKE '%abcnursing.com';
-- DELETE FROM patients WHERE id LIKE 'PAT%';
-- DELETE FROM tenants WHERE id LIKE '%001';

-- ============================================
-- 2. CREATE MOCK HOSPITALS (TENANTS)
-- ============================================
INSERT INTO tenants (id, name, subdomain, email, phone, plan_id, subscription_status, trial_ends_at, max_patients, max_users, enabled_modules)
VALUES 
  (
    'hope-001', 
    'Hope Multi-Specialty Hospital',
    'hope-hospital',
    'admin@hopehospital.com',
    '9876543210',
    (SELECT id FROM subscription_plans WHERE name = 'professional' LIMIT 1),
    'active',
    NOW() + INTERVAL '365 days',
    500,
    20,
    '["opd", "ipd", "lab", "pharmacy", "radiology", "billing"]'::jsonb
  ),
  (
    'xyz-001',
    'XYZ Medical Clinic',
    'xyz-clinic',
    'admin@xyzclinic.com',
    '9876543220',
    (SELECT id FROM subscription_plans WHERE name = 'starter' LIMIT 1),
    'trial',
    NOW() + INTERVAL '14 days',
    100,
    5,
    '["opd", "billing"]'::jsonb
  ),
  (
    'abc-001',
    'ABC Nursing Home',
    'abc-nursing',
    'admin@abcnursing.com',
    '9876543230',
    (SELECT id FROM subscription_plans WHERE name = 'enterprise' LIMIT 1),
    'active',
    NOW() + INTERVAL '365 days',
    -1, -- unlimited
    -1, -- unlimited
    '["opd", "ipd", "lab", "pharmacy", "radiology", "ot", "billing"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Create usage records for each tenant
INSERT INTO tenant_usage (tenant_id, patient_count, user_count)
VALUES
  ('hope-001', 0, 0),
  ('xyz-001', 0, 0),
  ('abc-001', 0, 0)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================
-- 3. CREATE MOCK USERS
-- ============================================

-- Helper: In production, use bcrypt hashed passwords
-- For testing, we'll use simple passwords
-- Password: SuperAdmin@123 (hashed)
-- Password: Admin@Hope123 (hashed)
-- etc.

-- Note: Replace these with actual bcrypt hashes in production
-- For now, using plain text for development (will be hashed by auth system)

-- SUPER ADMIN
INSERT INTO "User" (email, password, role, tenant_id, hospital_type, is_active)
VALUES 
  ('superadmin@yourapp.com', 'SuperAdmin@123', 'super_admin', NULL, NULL, true)
ON CONFLICT (email) DO NOTHING;

-- HOPE HOSPITAL USERS
INSERT INTO "User" (email, password, role, tenant_id, hospital_type, is_active)
VALUES
  -- Admin
  ('admin@hopehospital.com', 'Admin@Hope123', 'admin', 'hope-001', 'hope', true),
  
  -- Reception
  ('reception1@hopehospital.com', 'Reception@123', 'reception', 'hope-001', 'hope', true),
  ('reception2@hopehospital.com', 'Reception@456', 'reception', 'hope-001', 'hope', true),
  
  -- Lab
  ('lab@hopehospital.com', 'Lab@Hope123', 'lab', 'hope-001', 'hope', true),
  
  -- Radiology
  ('radiology@hopehospital.com', 'Radio@Hope123', 'radiology', 'hope-001', 'hope', true),
  
  -- Pharmacy
  ('pharmacy@hopehospital.com', 'Pharma@Hope123', 'pharmacy', 'hope-001', 'hope', true),
  
  -- Doctors
  ('doctor1@hopehospital.com', 'Doctor@Hope123', 'doctor', 'hope-001', 'hope', true),
  ('doctor2@hopehospital.com', 'Doctor@Hope456', 'doctor', 'hope-001', 'hope', true),
  ('doctor3@hopehospital.com', 'Doctor@Hope789', 'doctor', 'hope-001', 'hope', true),
  
  -- Nurses
  ('nurse1@hopehospital.com', 'Nurse@Hope123', 'nurse', 'hope-001', 'hope', true),
  ('nurse2@hopehospital.com', 'Nurse@Hope456', 'nurse', 'hope-001', 'hope', true)
ON CONFLICT (email) DO NOTHING;

-- XYZ CLINIC USERS
INSERT INTO "User" (email, password, role, tenant_id, hospital_type, is_active)
VALUES
  -- Admin
  ('admin@xyzclinic.com', 'Admin@XYZ123', 'admin', 'xyz-001', 'xyz', true),
  
  -- Reception
  ('reception@xyzclinic.com', 'Reception@XYZ123', 'reception', 'xyz-001', 'xyz', true),
  
  -- Lab
  ('lab@xyzclinic.com', 'Lab@XYZ123', 'lab', 'xyz-001', 'xyz', true),
  
  -- Pharmacy
  ('pharmacy@xyzclinic.com', 'Pharma@XYZ123', 'pharmacy', 'xyz-001', 'xyz', true)
ON CONFLICT (email) DO NOTHING;

-- ABC NURSING HOME USERS
INSERT INTO "User" (email, password, role, tenant_id, hospital_type, is_active)
VALUES
  -- Admin
  ('admin@abcnursing.com', 'Admin@ABC123', 'admin', 'abc-001', 'abc', true),
  
  -- Reception
  ('reception@abcnursing.com', 'Reception@ABC123', 'reception', 'abc-001', 'abc', true),
  
  -- Lab
  ('lab@abcnursing.com', 'Lab@ABC123', 'lab', 'abc-001', 'abc', true),
  
  -- Radiology
  ('radiology@abcnursing.com', 'Radio@ABC123', 'radiology', 'abc-001', 'abc', true),
  
  -- Pharmacy
  ('pharmacy@abcnursing.com', 'Pharma@ABC123', 'pharmacy', 'abc-001', 'abc', true),
  
  -- Doctor
  ('doctor@abcnursing.com', 'Doctor@ABC123', 'doctor', 'abc-001', 'abc', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 4. CREATE MOCK PATIENTS
-- ============================================

-- Hope Hospital Patients
INSERT INTO patients (id, name, age, gender, phone, email, address, tenant_id, hospital_name, created_at)
VALUES
  ('PAT-HOPE-001', 'Ram Kumar', 45, 'Male', '9876543210', 'ram.kumar@example.com', 
   '123 MG Road, Delhi - 110001', 'hope-001', 'hope', NOW() - INTERVAL '30 days'),
   
  ('PAT-HOPE-002', 'Sita Devi', 32, 'Female', '9876543211', 'sita.devi@example.com',
   '456 Park Street, Mumbai - 400001', 'hope-001', 'hope', NOW() - INTERVAL '25 days'),
   
  ('PAT-HOPE-003', 'Raj Sharma', 28, 'Male', '9876543212', 'raj.sharma@example.com',
   '789 Brigade Road, Bangalore - 560001', 'hope-001', 'hope', NOW() - INTERVAL '20 days'),
   
  ('PAT-HOPE-004', 'Priya Singh', 38, 'Female', '9876543213', 'priya.singh@example.com',
   '321 Anna Salai, Chennai - 600002', 'hope-001', 'hope', NOW() - INTERVAL '15 days'),
   
  ('PAT-HOPE-005', 'Amit Patel', 52, 'Male', '9876543214', 'amit.patel@example.com',
   '654 CG Road, Ahmedabad - 380009', 'hope-001', 'hope', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- XYZ Clinic Patients
INSERT INTO patients (id, name, age, gender, phone, email, address, tenant_id, hospital_name, created_at)
VALUES
  ('PAT-XYZ-001', 'Sunita Reddy', 40, 'Female', '9876543215', 'sunita.reddy@example.com',
   '111 Jubilee Hills, Hyderabad - 500033', 'xyz-001', 'xyz', NOW() - INTERVAL '12 days'),
   
  ('PAT-XYZ-002', 'Ravi Verma', 35, 'Male', '9876543216', 'ravi.verma@example.com',
   '222 Park Road, Pune - 411001', 'xyz-001', 'xyz', NOW() - INTERVAL '8 days'),
   
  ('PAT-XYZ-003', 'Anjali Nair', 29, 'Female', '9876543217', 'anjali.nair@example.com',
   '333 MG Road, Kochi - 682001', 'xyz-001', 'xyz', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ABC Nursing Home Patients
INSERT INTO patients (id, name, age, gender, phone, email, address, tenant_id, hospital_name, created_at)
VALUES
  ('PAT-ABC-001', 'Mohan Das', 65, 'Male', '9876543218', 'mohan.das@example.com',
   '444 Civil Lines, Jaipur - 302006', 'abc-001', 'abc', NOW() - INTERVAL '7 days'),
   
  ('PAT-ABC-002', 'Lakshmi Iyer', 58, 'Female', '9876543219', 'lakshmi.iyer@example.com',
   '555 T Nagar, Chennai - 600017', 'abc-001', 'abc', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 5. UPDATE USAGE COUNTS
-- ============================================

UPDATE tenant_usage 
SET 
  patient_count = (SELECT COUNT(*) FROM patients WHERE tenant_id = 'hope-001'),
  user_count = (SELECT COUNT(*) FROM "User" WHERE tenant_id = 'hope-001')
WHERE tenant_id = 'hope-001';

UPDATE tenant_usage 
SET 
  patient_count = (SELECT COUNT(*) FROM patients WHERE tenant_id = 'xyz-001'),
  user_count = (SELECT COUNT(*) FROM "User" WHERE tenant_id = 'xyz-001')
WHERE tenant_id = 'xyz-001';

UPDATE tenant_usage 
SET 
  patient_count = (SELECT COUNT(*) FROM patients WHERE tenant_id = 'abc-001'),
  user_count = (SELECT COUNT(*) FROM "User" WHERE tenant_id = 'abc-001')
WHERE tenant_id = 'abc-001';

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Check created tenants
SELECT 
  id,
  name,
  subdomain,
  subscription_status,
  (SELECT COUNT(*) FROM "User" WHERE tenant_id = tenants.id) as user_count,
  (SELECT COUNT(*) FROM patients WHERE tenant_id = tenants.id) as patient_count
FROM tenants
WHERE id LIKE '%001'
ORDER BY created_at;

-- Check created users
SELECT 
  email,
  role,
  tenant_id,
  is_active
FROM "User"
WHERE 
  email LIKE '%yourapp.com' 
  OR email LIKE '%hopehospital.com'
  OR email LIKE '%xyzclinic.com'
  OR email LIKE '%abcnursing.com'
ORDER BY tenant_id, role;

-- Check created patients
SELECT 
  id,
  name,
  age,
  phone,
  tenant_id
FROM patients
WHERE id LIKE 'PAT-%'
ORDER BY tenant_id, created_at;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Mock data seeded successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tenants created: 3';
  RAISE NOTICE '  • hope-001: Hope Multi-Specialty Hospital';
  RAISE NOTICE '  • xyz-001: XYZ Medical Clinic';
  RAISE NOTICE '  • abc-001: ABC Nursing Home';
  RAISE NOTICE '';
  RAISE NOTICE 'Users created: 20+';
  RAISE NOTICE '  • 1 Super Admin';
  RAISE NOTICE '  • 3 Hospital Admins';
  RAISE NOTICE '  • Multiple role-based users';
  RAISE NOTICE '';
  RAISE NOTICE 'Patients created: 10';
  RAISE NOTICE '  • 5 in Hope Hospital';
  RAISE NOTICE '  • 3 in XYZ Clinic';
  RAISE NOTICE '  • 2 in ABC Nursing Home';
  RAISE NOTICE '';
  RAISE NOTICE '📋 See MOCK_CREDENTIALS.md for login details';
END $$;
