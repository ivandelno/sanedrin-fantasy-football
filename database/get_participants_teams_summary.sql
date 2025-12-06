-- Function to get a summary of all participants, their selected teams, and points per team
CREATE OR REPLACE FUNCTION get_participants_teams_summary(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  username TEXT,
  total_season_points BIGINT,
  team_id UUID,
  team_name TEXT,
  league TEXT,
  role TEXT,
  team_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH participant_totals AS (
    -- Calculate total points per participant first
    SELECT 
      sp.id as p_id,
      COALESCE(SUM(pmp.points), 0) as total_points
    FROM season_participants sp
    LEFT JOIN participant_match_points pmp ON pmp.participant_id = sp.id AND pmp.season_id = p_season_id
    WHERE sp.season_id = p_season_id
    GROUP BY sp.id
  )
  SELECT 
    sp.id as participant_id,
    u.username,
    pt.total_points as total_season_points,
    t.id as team_id,
    t.name as team_name,
    t.league,
    ps.role,
    -- Sum points for this specific team from the breakdown_json
    COALESCE(SUM((pmp.breakdown_json->>'points')::int), 0) as team_points
  FROM season_participants sp
  JOIN users u ON u.id = sp.user_id
  JOIN participant_totals pt ON pt.p_id = sp.id
  JOIN participant_selections ps ON ps.participant_id = sp.id
  JOIN teams t ON t.id = ps.team_id
  -- Join match points filtering by the specific team in the JSON breakdown
  LEFT JOIN participant_match_points pmp ON pmp.participant_id = sp.id 
       AND pmp.season_id = p_season_id
       AND (pmp.breakdown_json->>'team_id')::uuid = ps.team_id
  WHERE sp.season_id = p_season_id
  GROUP BY sp.id, u.username, pt.total_points, t.id, t.name, t.league, ps.role
  ORDER BY u.username, 
           CASE t.league 
             WHEN 'CHAMPIONS' THEN 1 
             WHEN 'PRIMERA' THEN 2 
             WHEN 'SEGUNDA' THEN 3 
           END, 
           t.name;
END;
$$ LANGUAGE plpgsql;
