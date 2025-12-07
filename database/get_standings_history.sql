-- Function to get the evolution of points per participant per matchday
CREATE OR REPLACE FUNCTION get_standings_history(p_season_id UUID)
RETURNS TABLE (
  participant_id UUID,
  username TEXT,
  matchday INTEGER,
  matchday_points BIGINT,
  total_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH matchday_scores AS (
    SELECT 
      sp.id as p_id,
      sp.user_id,
      m.matchday,
      COALESCE(SUM(pmp.points), 0) as points
    FROM season_participants sp
    JOIN participant_match_points pmp ON pmp.participant_id = sp.id
    JOIN matches m ON m.id = pmp.match_id
    WHERE sp.season_id = p_season_id AND m.status = 'FINISHED'
    GROUP BY sp.id, sp.user_id, m.matchday
  )
  SELECT 
    ms.p_id as participant_id,
    u.username,
    ms.matchday,
    ms.points as matchday_points,
    SUM(ms.points) OVER (PARTITION BY ms.p_id ORDER BY ms.matchday)::BIGINT as total_points
  FROM matchday_scores ms
  JOIN users u ON u.id = ms.user_id
  ORDER BY ms.matchday ASC, total_points DESC;
END;
$$ LANGUAGE plpgsql;
