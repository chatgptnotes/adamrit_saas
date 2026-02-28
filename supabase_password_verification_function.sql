-- Server-Side Password Verification Function
-- This moves bcrypt from client to server for better mobile performance
-- Run this in Supabase SQL Editor

-- Create extension for bcrypt (if not exists)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_user_password(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  user_hospital_type TEXT,
  user_full_name TEXT,
  user_phone TEXT,
  user_is_active BOOLEAN,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_stored_password TEXT;
  v_is_hashed BOOLEAN;
BEGIN
  -- Get user by email
  SELECT * INTO v_user
  FROM "User"
  WHERE email = LOWER(p_email);

  -- User not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE;
    RETURN;
  END IF;

  -- Check if password is hashed or plain
  v_stored_password := v_user.password;
  v_is_hashed := v_stored_password LIKE '$2%';

  -- Verify password
  IF v_is_hashed THEN
    -- Use crypt to verify bcrypt hash
    IF crypt(p_password, v_stored_password) = v_stored_password THEN
      -- Password valid
      RETURN QUERY SELECT 
        v_user.id::UUID,
        v_user.email::TEXT,
        v_user.role::TEXT,
        v_user.hospital_type::TEXT,
        v_user.full_name::TEXT,
        v_user.phone::TEXT,
        v_user.is_active::BOOLEAN,
        TRUE;
    ELSE
      -- Password invalid
      RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE;
    END IF;
  ELSE
    -- Plain text comparison (backward compatibility)
    IF p_password = v_stored_password THEN
      RETURN QUERY SELECT 
        v_user.id::UUID,
        v_user.email::TEXT,
        v_user.role::TEXT,
        v_user.hospital_type::TEXT,
        v_user.full_name::TEXT,
        v_user.phone::TEXT,
        v_user.is_active::BOOLEAN,
        TRUE;
    ELSE
      RETURN QUERY SELECT 
        NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::BOOLEAN, FALSE;
    END IF;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION verify_user_password(TEXT, TEXT) TO anon, authenticated;

-- Test the function (optional)
-- SELECT * FROM verify_user_password('admin@hopehospital.com', 'your_password');
