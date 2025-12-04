-- ============================================
-- Permissions and Security for Supabase
-- ============================================
-- Run this script to grant necessary permissions for the web app to work

-- ============================================
-- Grant Execute Permissions on Functions
-- ============================================
-- Allow anonymous users to call authentication functions
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION verify_user_password(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_user_password(UUID, TEXT) TO authenticated;

GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION create_user(TEXT, TEXT, BOOLEAN) TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION calculate_match_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_participant_standings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_participant_standings(UUID) TO anon;

-- ============================================
-- Grant Table Permissions
-- ============================================
-- Users table - read access for authenticated users
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Seasons table
GRANT SELECT ON seasons TO anon;
GRANT SELECT ON seasons TO authenticated;
GRANT INSERT, UPDATE, DELETE ON seasons TO authenticated;

-- Teams table
GRANT SELECT ON teams TO anon;
GRANT SELECT ON teams TO authenticated;
GRANT INSERT, UPDATE, DELETE ON teams TO authenticated;

-- Season participants
GRANT SELECT ON season_participants TO anon;
GRANT SELECT ON season_participants TO authenticated;
GRANT INSERT, UPDATE, DELETE ON season_participants TO authenticated;

-- Participant selections
GRANT SELECT ON participant_selections TO anon;
GRANT SELECT ON participant_selections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON participant_selections TO authenticated;

-- Participant changes
GRANT SELECT ON participant_changes TO anon;
GRANT SELECT ON participant_changes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON participant_changes TO authenticated;

-- Matches
GRANT SELECT ON matches TO anon;
GRANT SELECT ON matches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON matches TO authenticated;

-- Participant match points
GRANT SELECT ON participant_match_points TO anon;
GRANT SELECT ON participant_match_points TO authenticated;
GRANT INSERT, UPDATE, DELETE ON participant_match_points TO authenticated;

-- News tables
GRANT SELECT ON news TO anon;
GRANT SELECT ON news TO authenticated;
GRANT INSERT, UPDATE, DELETE ON news TO authenticated;

GRANT SELECT ON news_comments TO anon;
GRANT SELECT ON news_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON news_comments TO authenticated;

GRANT SELECT ON news_likes TO anon;
GRANT SELECT ON news_likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON news_likes TO authenticated;

-- Season config
GRANT SELECT ON season_config TO anon;
GRANT SELECT ON season_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON season_config TO authenticated;

-- Team name mappings
GRANT SELECT ON team_name_mappings TO anon;
GRANT SELECT ON team_name_mappings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON team_name_mappings TO authenticated;

-- ============================================
-- Disable RLS for Development (TEMPORARY)
-- ============================================
-- WARNING: This disables Row Level Security for easier development
-- In production, you should enable RLS and create proper policies

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE season_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE participant_selections DISABLE ROW LEVEL SECURITY;
ALTER TABLE participant_changes DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE participant_match_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE news DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE news_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE season_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_name_mappings DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Comments
-- ============================================
COMMENT ON SCHEMA public IS 'Standard public schema with permissions for anon and authenticated roles';
