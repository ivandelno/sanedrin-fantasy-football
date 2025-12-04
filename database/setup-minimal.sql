-- ============================================
-- Porra del Sanedrín - Minimal Setup Script
-- ============================================
-- This is a minimal version that creates only the essential tables

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Drop existing tables to ensure clean slate
-- ============================================

DROP TABLE IF EXISTS news_likes CASCADE;
DROP TABLE IF EXISTS news_comments CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS team_name_mappings CASCADE;
DROP TABLE IF EXISTS season_config CASCADE;

-- ============================================
-- Create Tables
-- ============================================

-- News table
CREATE TABLE news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News comments
CREATE TABLE news_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News likes
CREATE TABLE news_likes (
  news_id UUID REFERENCES news(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (news_id, user_id)
);

-- Season configuration
CREATE TABLE season_config (
  season_id UUID PRIMARY KEY REFERENCES seasons(id) ON DELETE CASCADE,
  max_changes INTEGER DEFAULT 3,
  extraordinary_window_start_matchday INTEGER,
  eligible_team_ids UUID[],
  primera_sumar_count INTEGER DEFAULT 2,
  primera_restar_count INTEGER DEFAULT 2,
  segunda_sumar_count INTEGER DEFAULT 2,
  segunda_restar_count INTEGER DEFAULT 2,
  champions_sumar_count INTEGER DEFAULT 2,
  suplente_primera_count INTEGER DEFAULT 2,
  suplente_segunda_count INTEGER DEFAULT 2
);

-- Team name mappings (for API normalization)
CREATE TABLE team_name_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_name TEXT NOT NULL,
  db_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  league TEXT NOT NULL,
  source TEXT DEFAULT 'api-football',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(api_name, source)
);

-- ============================================
-- Helper Functions
-- ============================================

-- Function to calculate points for a match
CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id UUID)
RETURNS VOID AS $$
DECLARE
  v_match RECORD;
  v_selection RECORD;
  v_points INTEGER;
  v_result TEXT;
BEGIN
  -- Get match details
  SELECT * INTO v_match FROM matches WHERE id = p_match_id AND status = 'FINISHED';
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate points for each participant's selections
  FOR v_selection IN 
    SELECT ps.*, sp.id as participant_id
    FROM participant_selections ps
    JOIN season_participants sp ON sp.id = ps.participant_id
    WHERE ps.season_id = v_match.season_id
      AND (ps.team_id = v_match.home_team_id OR ps.team_id = v_match.away_team_id)
  LOOP
    -- Determine match result for this team
    IF v_selection.team_id = v_match.home_team_id THEN
      IF v_match.home_score > v_match.away_score THEN
        v_result := 'WIN';
      ELSIF v_match.home_score = v_match.away_score THEN
        v_result := 'DRAW';
      ELSE
        v_result := 'LOSS';
      END IF;
    ELSE
      IF v_match.away_score > v_match.home_score THEN
        v_result := 'WIN';
      ELSIF v_match.away_score = v_match.home_score THEN
        v_result := 'DRAW';
      ELSE
        v_result := 'LOSS';
      END IF;
    END IF;

    -- Calculate points based on role
    IF v_selection.role IN ('SUMAR', 'SUPLENTE_SUMAR', 'SUPLENTE') THEN
      CASE v_result
        WHEN 'WIN' THEN v_points := 3;
        WHEN 'DRAW' THEN v_points := 1;
        WHEN 'LOSS' THEN v_points := 0;
      END CASE;
    ELSIF v_selection.role = 'RESTAR' THEN
      CASE v_result
        WHEN 'WIN' THEN v_points := -3;
        WHEN 'DRAW' THEN v_points := -1;
        WHEN 'LOSS' THEN v_points := 0;
      END CASE;
    ELSE
      v_points := 0;
    END IF;

    -- Insert or update points
    INSERT INTO participant_match_points (season_id, participant_id, match_id, points, breakdown_json)
    VALUES (
      v_match.season_id,
      v_selection.participant_id,
      p_match_id,
      v_points,
      jsonb_build_object(
        'team_id', v_selection.team_id,
        'role', v_selection.role,
        'match_result', v_result,
        'points', v_points
      )
    )
    ON CONFLICT (season_id, participant_id, match_id) 
    DO UPDATE SET 
      points = EXCLUDED.points,
      breakdown_json = EXCLUDED.breakdown_json;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get participant standings
CREATE OR REPLACE FUNCTION get_participant_standings(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  username TEXT,
  total_points BIGINT,
  "position" INTEGER,
  matches_played BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH points_summary AS (
    SELECT 
      pmp.participant_id,
      SUM(pmp.points) as total_points,
      COUNT(DISTINCT pmp.match_id) as matches_played
    FROM participant_match_points pmp
    WHERE pmp.season_id = p_season_id
    GROUP BY pmp.participant_id
  ),
  ranked AS (
    SELECT 
      sp.id as participant_id,
      sp.user_id,
      u.username,
      COALESCE(ps.total_points, 0) as total_points,
      COALESCE(ps.matches_played, 0) as matches_played,
      ROW_NUMBER() OVER (ORDER BY COALESCE(ps.total_points, 0) DESC) as "position"
    FROM season_participants sp
    JOIN users u ON u.id = sp.user_id
    LEFT JOIN points_summary ps ON ps.participant_id = sp.id
    WHERE sp.season_id = p_season_id
  )
  SELECT 
    r.participant_id,
    r.user_id,
    r.username,
    r.total_points,
    r."position"::INTEGER,
    r.matches_played
  FROM ranked r
  ORDER BY r."position";
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample Users
-- ============================================

INSERT INTO users (username, password_hash, is_admin)
VALUES ('admin', crypt('admin123', gen_salt('bf')), TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, is_admin)
VALUES ('usuario1', crypt('user123', gen_salt('bf')), FALSE)
ON CONFLICT (username) DO NOTHING;
