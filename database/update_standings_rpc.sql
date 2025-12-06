-- Update get_participant_standings to count changes dynamically from participant_changes table
-- Fix: Rename "position" to "rank_position" to avoid reserved keyword conflict
DROP FUNCTION IF EXISTS get_participant_standings(UUID);

CREATE OR REPLACE FUNCTION get_participant_standings(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  username TEXT,
  total_points BIGINT,
  rank_position BIGINT, -- Renamed from "position"
  position_change INTEGER,
  matches_played BIGINT,
  changes_used BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH calculated_points AS (
    SELECT 
      sp.id as p_id,
      COALESCE(SUM(pmp.points), 0) as points,
      COUNT(DISTINCT pmp.match_id) as matches
    FROM season_participants sp
    LEFT JOIN participant_match_points pmp ON pmp.participant_id = sp.id AND pmp.season_id = p_season_id
    WHERE sp.season_id = p_season_id
    GROUP BY sp.id
  ),
  real_changes AS (
    SELECT 
      participant_id,
      COUNT(*) as change_count
    FROM participant_changes
    WHERE season_id = p_season_id
    GROUP BY participant_id
  )
  SELECT 
    sp.id,
    sp.user_id,
    u.username,
    cp.points,
    RANK() OVER (ORDER BY cp.points DESC, u.username) as rank_position,
    0::INTEGER as position_change, -- Placeholder for now
    cp.matches,
    COALESCE(rc.change_count, 0) as changes_used
  FROM season_participants sp
  JOIN users u ON u.id = sp.user_id
  LEFT JOIN calculated_points cp ON cp.p_id = sp.id
  LEFT JOIN real_changes rc ON rc.participant_id = sp.id
  WHERE sp.season_id = p_season_id
  ORDER BY cp.points DESC, u.username;
END;
$$ LANGUAGE plpgsql;
