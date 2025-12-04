-- ============================================
-- DEBUG SEASON SCRIPT
-- ============================================

-- 1. Check what's in the seasons table
SELECT id, name, is_active, start_date, end_date 
FROM seasons;

-- 2. Check season configuration
SELECT * FROM season_config;

-- 3. Check if there are any other tables that might be confusing (optional check)
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('competitions', 'season_rules');

-- ============================================
-- FIX: Activate the most recent season
-- ============================================
-- Run this part if you see a season but is_active is false

UPDATE seasons 
SET is_active = TRUE 
WHERE id = (
  SELECT id FROM seasons 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Verify again
SELECT id, name, is_active FROM seasons;
