-- ============================================
-- Test and Debug Login Function
-- ============================================
-- Run these queries one by one to debug the login issue

-- 1. Check if users exist
SELECT id, username, is_admin, 
       CASE WHEN password_hash IS NOT NULL THEN 'Has password' ELSE 'No password' END as password_status
FROM users 
WHERE username IN ('admin', 'usuario1');

-- 2. Test the login_user function directly with admin
SELECT * FROM login_user('admin', 'admin123');

-- 3. Test the login_user function directly with usuario1
SELECT * FROM login_user('usuario1', 'user123');

-- 4. Check function permissions
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
    CASE 
        WHEN p.proacl IS NULL THEN 'No explicit permissions (uses default)'
        ELSE array_to_string(p.proacl, ', ')
    END as permissions
FROM pg_proc p
WHERE p.proname = 'login_user';

-- 5. Verify the function signature
SELECT 
    routine_name,
    routine_type,
    data_type,
    type_udt_name
FROM information_schema.routines
WHERE routine_name = 'login_user'
  AND routine_schema = 'public';

-- 6. Check parameters
SELECT 
    parameter_name,
    data_type,
    parameter_mode,
    ordinal_position
FROM information_schema.parameters
WHERE specific_schema = 'public'
  AND specific_name LIKE '%login_user%'
ORDER BY ordinal_position;

-- 7. Manual password verification for admin user
SELECT 
    username,
    password_hash = crypt('admin123', password_hash) as password_matches
FROM users
WHERE username = 'admin';

-- 8. If users don't exist, create them
-- Uncomment and run if needed:
-- INSERT INTO users (username, password_hash, is_admin)
-- VALUES ('admin', crypt('admin123', gen_salt('bf')), TRUE)
-- ON CONFLICT (username) DO UPDATE 
-- SET password_hash = crypt('admin123', gen_salt('bf'));

-- INSERT INTO users (username, password_hash, is_admin)
-- VALUES ('usuario1', crypt('user123', gen_salt('bf')), FALSE)
-- ON CONFLICT (username) DO UPDATE 
-- SET password_hash = crypt('user123', gen_salt('bf'));
