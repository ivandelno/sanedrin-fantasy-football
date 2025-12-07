-- Function to get a summary of all participants, their selected teams, and points per team
-- Revised version: Uses breakdown array for accurate team point attribution
DROP FUNCTION IF EXISTS get_participants_teams_summary(UUID);

CREATE OR REPLACE FUNCTION get_participants_teams_summary(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  username TEXT,
  total_season_points BIGINT,
  team_id UUID,
  team_name TEXT,
  league TEXT,
  role TEXT,
  team_points BIGINT,
  last_change_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as participant_id,
    sp.user_id,
    u.username,
    -- Calculate total points for the participant using a subquery (sum of match totals)
    COALESCE((
      SELECT SUM(pmp_total.points)
      FROM participant_match_points pmp_total
      WHERE pmp_total.participant_id = sp.id AND pmp_total.season_id = p_season_id
    ), 0) as total_season_points,
    t.id as team_id,
    t.name as team_name,
    t.league::text,
    -- DYNAMIC ROLE CALCULATION
    COALESCE(
      (SELECT 
         CASE 
           WHEN pc.to_team_id = t.id THEN pc.to_role::text
           WHEN pc.from_team_id = t.id AND pc.change_type = 'SUPLENTE' THEN 'SUPLENTE'
           ELSE pc.from_role::text
         END
       FROM participant_changes pc
       WHERE pc.participant_id = sp.id 
         AND (pc.from_team_id = t.id OR pc.to_team_id = t.id)
       ORDER BY pc.executed_at DESC
       LIMIT 1
      ), 
      ps.role::text
    ) as role,
    -- Sum points for this specific team using the breakdown array
    COALESCE((
      SELECT SUM((item->>'points')::int)
      FROM participant_match_points pmp,
           jsonb_array_elements(pmp.breakdown_json->'breakdown') item
      WHERE pmp.participant_id = sp.id 
        AND pmp.season_id = p_season_id
        AND (item->>'team_id')::uuid = t.id
    ), 0) as team_points,
    last_change.executed_at as last_change_date
  FROM season_participants sp
  JOIN users u ON u.id = sp.user_id
  JOIN participant_selections ps ON ps.participant_id = sp.id
  JOIN teams t ON t.id = ps.team_id
  -- Get latest change date for this team (for display)
  LEFT JOIN LATERAL (
    SELECT executed_at 
    FROM participant_changes pc 
    WHERE pc.participant_id = sp.id 
      AND (pc.from_team_id = t.id OR pc.to_team_id = t.id)
    ORDER BY pc.executed_at DESC LIMIT 1
  ) last_change ON true
  WHERE sp.season_id = p_season_id
  GROUP BY sp.id, sp.user_id, u.username, t.id, t.name, t.league, ps.role, last_change.executed_at
  ORDER BY u.username, 
           -- Sort by DYNAMIC ROLE: 1. Titulares (0), 2. Suplentes (1)
           CASE WHEN 
             COALESCE(
               (SELECT 
                  CASE 
                    WHEN pc.to_team_id = t.id THEN pc.to_role::text
                    WHEN pc.from_team_id = t.id AND pc.change_type = 'SUPLENTE' THEN 'SUPLENTE'
                    ELSE pc.from_role::text
                  END
                FROM participant_changes pc
                WHERE pc.participant_id = sp.id 
                  AND (pc.from_team_id = t.id OR pc.to_team_id = t.id)
                ORDER BY pc.executed_at DESC
                LIMIT 1
               ), 
               ps.role::text
             ) LIKE 'SUPLENTE%' THEN 1 ELSE 0 END,
           -- League order
           CASE t.league::text 
             WHEN 'CHAMPIONS' THEN 1 
             WHEN 'PRIMERA' THEN 2 
             WHEN 'SEGUNDA' THEN 3 
           END, 
           t.name;
END;
$$ LANGUAGE plpgsql;
