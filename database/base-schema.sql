-- ============================================
-- Porra del Sanedrín - Base Database Schema
-- ============================================
-- This script creates the core tables for the application
-- ⚠️ This matches your existing Supabase schema structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Core Tables (matching your existing schema)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  league TEXT NOT NULL CHECK (league IN ('PRIMERA', 'SEGUNDA', 'CHAMPIONS')),
  logo_url TEXT,
  api_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, league)
);

-- Season participants (users participating in a season)
CREATE TABLE IF NOT EXISTS season_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, user_id)
);

-- Participant team selections
CREATE TABLE IF NOT EXISTS participant_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES season_participants(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  league TEXT NOT NULL CHECK (league IN ('PRIMERA', 'SEGUNDA', 'CHAMPIONS')),
  role TEXT NOT NULL CHECK (role IN ('SUMAR', 'RESTAR', 'SUPLENTE', 'SUPLENTE_SUMAR')),
  is_active BOOLEAN DEFAULT TRUE,
  selected_at TIMESTAMPTZ DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  UNIQUE(season_id, participant_id, team_id, is_active)
);

-- Participant changes (team substitutions)
CREATE TABLE IF NOT EXISTS participant_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES season_participants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  from_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  to_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  from_role TEXT,
  to_role TEXT,
  league TEXT NOT NULL CHECK (league IN ('PRIMERA', 'SEGUNDA', 'CHAMPIONS')),
  matchday INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  league TEXT NOT NULL CHECK (league IN ('PRIMERA', 'SEGUNDA', 'CHAMPIONS')),
  matchday INTEGER NOT NULL,
  utc_datetime TIMESTAMPTZ NOT NULL,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'FINISHED', 'POSTPONED', 'CANCELLED', 'LIVE')),
  external_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participant match points (calculated points for each match)
CREATE TABLE IF NOT EXISTS participant_match_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID REFERENCES seasons(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES season_participants(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  breakdown_json JSONB,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(season_id, participant_id, match_id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
-- Note: Index creation has been commented out to avoid conflicts with existing tables.
-- If you want to add indexes, uncomment and modify these lines based on your actual table structure:
--
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);
-- CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);
-- CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active);
-- CREATE INDEX IF NOT EXISTS idx_season_participants_season ON season_participants(season_id);
-- CREATE INDEX IF NOT EXISTS idx_season_participants_user ON season_participants(user_id);
-- CREATE INDEX IF NOT EXISTS idx_participant_selections_season_participant ON participant_selections(season_id, participant_id);
-- CREATE INDEX IF NOT EXISTS idx_matches_season_league ON matches(season_id, league);
-- CREATE INDEX IF NOT EXISTS idx_matches_matchday ON matches(matchday);
-- CREATE INDEX IF NOT EXISTS idx_matches_datetime ON matches(utc_datetime);
-- CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
-- CREATE INDEX IF NOT EXISTS idx_participant_match_points_season_participant ON participant_match_points(season_id, participant_id);
-- CREATE INDEX IF NOT EXISTS idx_participant_changes_participant ON participant_changes(participant_id);


-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE users IS 'Application users with authentication credentials';
COMMENT ON TABLE teams IS 'Football teams from different leagues';
COMMENT ON TABLE seasons IS 'Competition seasons';
COMMENT ON TABLE season_participants IS 'Users participating in each season';
COMMENT ON TABLE participant_selections IS 'Team selections for each participant (SUMAR/RESTAR/SUPLENTE)';
COMMENT ON TABLE participant_changes IS 'History of team substitutions made by participants';
COMMENT ON TABLE matches IS 'Football matches with results';
COMMENT ON TABLE participant_match_points IS 'Calculated points for each participant per match';
