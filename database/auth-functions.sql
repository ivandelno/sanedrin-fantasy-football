-- ============================================
-- Authentication Functions for Supabase
-- ============================================
-- Run this script in your Supabase SQL Editor to enable authentication

-- Ensure pgcrypto extension is enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Login Function
-- ============================================
-- Drop existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);

-- This function verifies username and password and returns user data
CREATE FUNCTION login_user(p_username TEXT, p_password TEXT)
RETURNS TABLE (
  id UUID,
  username TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.username,
    u.is_admin,
    u.created_at
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Verify User Password Function
-- ============================================
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS verify_user_password(UUID, TEXT);

-- This function verifies if a password is correct for a given user ID
CREATE OR REPLACE FUNCTION verify_user_password(p_uid UUID, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  SELECT password_hash INTO v_password_hash
  FROM users
  WHERE id = p_uid;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN v_password_hash = crypt(p_password, v_password_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create User Function
-- ============================================
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_user(TEXT, TEXT, BOOLEAN);

-- This function creates a new user with encrypted password
CREATE OR REPLACE FUNCTION create_user(
  p_username TEXT,
  p_password TEXT,
  p_is_admin BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO users (username, password_hash, is_admin)
  VALUES (p_username, crypt(p_password, gen_salt('bf')), p_is_admin)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================
COMMENT ON FUNCTION login_user IS 'Authenticates a user and returns their data if credentials are valid';
COMMENT ON FUNCTION verify_user_password IS 'Verifies if a password is correct for a given user ID';
COMMENT ON FUNCTION create_user IS 'Creates a new user with encrypted password';
