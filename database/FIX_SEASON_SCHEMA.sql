-- ============================================
-- FIX SEASON SCHEMA
-- ============================================
-- This script adapts the existing 'seasons' table to match the web app requirements.

-- 1. Add missing columns
ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'IN_PROGRESS' CHECK (status IN ('SETUP', 'SELECTION_OPEN', 'IN_PROGRESS', 'FINISHED'));

ALTER TABLE seasons 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Activate the most recent season
-- This ensures the web app finds a season to load
UPDATE seasons 
SET 
  is_active = TRUE,
  status = 'IN_PROGRESS'
WHERE id = (
  SELECT id FROM seasons 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- 3. Verify the result
SELECT id, name, is_active, status FROM seasons;
