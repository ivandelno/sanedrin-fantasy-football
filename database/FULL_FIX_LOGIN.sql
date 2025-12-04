-- ============================================
-- FULL FIX LOGIN SCRIPT (MASTER SCRIPT)
-- ============================================
-- This script combines function creation AND permissions
-- Run this SINGLE script to fix all login issues.

-- 1. Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 2. Drop existing functions to ensure clean slate
-- ============================================
DROP FUNCTION IF EXISTS login_user(TEXT, TEXT);
DROP FUNCTION IF EXISTS verify_user_password(UUID, TEXT);
DROP FUNCTION IF EXISTS create_user(TEXT, TEXT, BOOLEAN);

-- ============================================
-- 3. Re-create functions (CORRECTED VERSION)
-- ============================================

-- Login Function (Fixed: removed updated_at column)
CREATE OR REPLACE FUNCTION login_user(p_username TEXT, p_password TEXT)
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

-- Verify Password Function
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

-- Create User Function
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
-- 4. GRANT PERMISSIONS (CRITICAL STEP)
-- ============================================

-- Grant execute to anon (for login) and authenticated users
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION verify_user_password(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_user_password(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, BOOLEAN) TO authenticated;

-- Grant table permissions
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO authenticated;

-- ============================================
-- 5. Ensure Test Users Exist
-- ============================================

INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', crypt('admin123', gen_salt('bf')), TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, is_admin)
VALUES ('usuario1', crypt('user123', gen_salt('bf')), FALSE)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 6. Verification
-- ============================================
-- This query will show if permissions are correctly applied
SELECT 
    proname as function_name, 
    CASE WHEN proacl IS NULL THEN 'NO PERMISSIONS!' ELSE 'OK (Permissions set)' END as status
FROM pg_proc 
WHERE proname IN ('login_user', 'verify_user_password', 'create_user');
