-- ============================================
-- Add unique constraint for match upsert
-- ============================================
-- This constraint ensures we don't have duplicate matches
-- and allows the upsert operation to work correctly

-- First, check if there are any duplicate matches that would violate the constraint
SELECT season_id, league, matchday, home_team_id, away_team_id, COUNT(*)
FROM matches
GROUP BY season_id, league, matchday, home_team_id, away_team_id
HAVING COUNT(*) > 1;

-- If the above query returns no rows, we can safely add the constraint
-- If it returns rows, you'll need to manually resolve the duplicates first

-- Add the unique constraint
ALTER TABLE matches 
ADD CONSTRAINT matches_unique_game 
UNIQUE (season_id, league, matchday, home_team_id, away_team_id);

-- Verify the constraint was created
SELECT conname, contype, conkey 
FROM pg_constraint 
WHERE conrelid = 'matches'::regclass 
AND conname = 'matches_unique_game';
