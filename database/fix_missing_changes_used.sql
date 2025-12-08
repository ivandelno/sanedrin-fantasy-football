-- Add missing changes_used column to season_participants table
-- This column is required for tracking team substitutions

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'season_participants' 
                   AND column_name = 'changes_used') THEN
        ALTER TABLE season_participants 
        ADD COLUMN changes_used INTEGER DEFAULT 0;
    END IF;
END $$;

COMMENT ON COLUMN season_participants.changes_used IS 'Number of team changes made by the participant in this season';
