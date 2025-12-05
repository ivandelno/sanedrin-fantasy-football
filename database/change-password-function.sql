-- ============================================
-- Change Password Function
-- ============================================
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS change_user_password(UUID, TEXT, TEXT);

-- This function changes a user's password after verifying the current password
CREATE OR REPLACE FUNCTION change_user_password(
  p_user_id UUID,
  p_current_password TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_password_hash TEXT;
BEGIN
  -- Get current password hash
  SELECT password_hash INTO v_password_hash
  FROM users
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Verify current password
  IF v_password_hash != crypt(p_current_password, v_password_hash) THEN
    RAISE EXCEPTION 'Current password is incorrect';
  END IF;
  
  -- Update to new password
  UPDATE users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION change_user_password IS 'Changes a user password after verifying the current password';
