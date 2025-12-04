-- ============================================
-- GET DATABASE SCHEMA INFO
-- ============================================
-- Run this to see all tables and columns in your database

SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name, 
    ordinal_position;
