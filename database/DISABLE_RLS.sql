-- ============================================
-- DISABLE RLS SCRIPT (NUCLEAR OPTION)
-- ============================================
-- Use this if you still get 401 errors.
-- It disables Row Level Security on the users table.

ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-grant permissions just in case
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
