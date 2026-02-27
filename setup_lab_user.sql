-- Setup Lab User in User table for Adamrit Project
-- Email: lab@hopehospital.com
-- Password: Lab@Hope123
-- Role: lab (matches RoleBasedDashboard expectations)

-- Check if user already exists
SELECT id, email, role, hospital_type FROM public."User" WHERE email = 'lab@hopehospital.com';

-- Insert or update lab user with correct role
INSERT INTO public."User" (email, password, role, hospital_type)
VALUES (
  'lab@hopehospital.com',
  '$2b$10$w0YCmvSST5HJvbWo29o9WeeP2vC/IbpPdK5EYbYAyEt7o48cyVn8O',  -- Lab@Hope123
  'lab',  -- ✅ Correct role for RoleBasedDashboard
  'hope'
)
ON CONFLICT (email) DO UPDATE 
SET 
  password = EXCLUDED.password,
  role = 'lab',  -- ✅ Force update to 'lab' role
  hospital_type = 'hope';

-- Verify the user was created/updated with correct role
SELECT id, email, role, hospital_type, created_at FROM public."User" WHERE email = 'lab@hopehospital.com';
